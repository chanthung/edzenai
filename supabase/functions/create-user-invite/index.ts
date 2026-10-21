import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { canInviteExistingHrRecord } from './hr-record-compatibility.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://edzenai.com';

async function sendWhatsApp(phone: string, message: string, schoolName: string): Promise<{ ok: boolean; error?: string }> {
  const waApiKey = Deno.env.get('WHATSAPP_API_KEY');
  if (!waApiKey) return { ok: false, error: 'WhatsApp not configured' };

  const digits = phone.replace(/\D/g, '');
  const number = digits.length === 10 ? `91${digits}` : digits;

  const payload = {
    api_key: waApiKey,
    sender: '919366084335',
    number,
    message,
    footer: `Sent via ${schoolName}`,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://wp.mayaviinfotech.in/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.status) return { ok: true };
      console.error(`WhatsApp attempt ${attempt} failed:`, JSON.stringify(result));
    } catch (err) {
      console.error(`WhatsApp attempt ${attempt} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
  }
  return { ok: false, error: 'WhatsApp delivery failed' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: schoolAdmin } = await supabaseAdmin
      .from('school_admins')
      .select('school_id')
      .eq('user_id', callerUser.id)
      .maybeSingle();

    if (!schoolAdmin) {
      return new Response(JSON.stringify({ error: 'Only school admins can invite users' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Stage 2: invite an existing HR-only teacher record. The target ID is only a
    // request; the server-only operation verifies the caller's school membership,
    // eligibility and email identity under lock. No account is linked here.
    if (body?.target_teacher_id !== undefined && body?.target_teacher_id !== null) {
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const targetId = String(body.target_teacher_id);
      const targetEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const dm = body.delivery_method ?? 'email';
      const ph = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
      if (!UUID_RE.test(targetId)) {
        return new Response(JSON.stringify({ error: 'Invalid teacher selection' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail) || targetEmail.length > 254) {
        return new Response(JSON.stringify({ error: 'Enter a valid invitation email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!['email', 'whatsapp', 'both'].includes(dm)) {
        return new Response(JSON.stringify({ error: 'Invalid delivery method' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: issued, error: issueErr } = await supabaseAdmin.rpc('issue_teacher_link_invite', {
        _actor: callerUser.id, _teacher: targetId, _email: targetEmail, _delivery: dm, _phone: ph,
      });
      const row = Array.isArray(issued) ? issued[0] : issued;
      if (issueErr || !row) {
        const msg = issueErr?.message ?? 'Failed to create invitation';
        const status = issueErr?.code === '42501' ? 403 : 409;
        const friendly = /duplicate key|one_pending_teacher_target/i.test(msg)
          ? 'An invitation is already pending for this teacher. Use Resend or Cancel.'
          : msg;
        return new Response(JSON.stringify({ error: friendly }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const { data: tRow } = await supabaseAdmin.from('school_teachers').select('name, school_id').eq('id', targetId).single();
      const { data: sch } = await supabaseAdmin.from('schools').select('name').eq('id', tRow?.school_id).single();
      const tName = tRow?.name ?? 'there';
      const sName = sch?.name || 'your school';
      const url = `${APP_URL}/auth/accept-invite?token=${row.invite_token}`;
      const inviter = callerUser.user_metadata?.full_name || callerUser.email || 'Your school admin';
      let emailOk = true; let waOk = true; let waError: string | undefined;
      if (dm === 'email' || dm === 'both') {
        const { error: eErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
          body: { templateName: 'user-invite', recipientEmail: targetEmail, idempotencyKey: `invite-${row.invite_id}`,
            templateData: { name: tName, schoolName: sName, roleLabel: 'Teacher', inviteUrl: url, expiresInDays: 7, invitedByName: inviter } },
        });
        if (eErr) { console.error('Email send error:', eErr); emailOk = false; }
      }
      if ((dm === 'whatsapp' || dm === 'both') && ph) {
        const r = await sendWhatsApp(ph, `Hi ${tName}, you've been invited to join ${sName} on EdZen AI as a Teacher.\n\nSet your password & activate your account here:\n${url}\n\n⏰ This link expires in 7 days.`, sName);
        waOk = r.ok; waError = r.error;
      }
      return new Response(JSON.stringify({ success: true, inviteId: row.invite_id, expiresAt: row.invite_expires_at, targeted: true, delivery: { emailOk, waOk, waError } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const {
      name,
      email,
      employee_id = null,
      role = 'teacher',
      delivery_method = 'email',
      phone = null,
      assignments = [],
    } = body;


    if (!name?.trim() || !email?.trim()) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['teacher', 'accountant'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['email', 'whatsapp', 'both'].includes(delivery_method)) {
      return new Response(JSON.stringify({ error: 'Invalid delivery method' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if ((delivery_method === 'whatsapp' || delivery_method === 'both') && !phone?.trim()) {
      return new Response(JSON.stringify({ error: 'Phone number required for WhatsApp delivery' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Existing linked accounts remain blocked. A unique matching HR-only
    // record may receive an explicit invitation via the unchanged Add User flow.
    const { data: existingTeachers, error: existingError } = await supabaseAdmin
      .from('school_teachers')
      .select('user_id, name, role')
      .eq('school_id', schoolAdmin.school_id)
      .eq('email', email.trim().toLowerCase());

    if (existingError || !canInviteExistingHrRecord(existingTeachers ?? [], name, role)) {
      return new Response(JSON.stringify({ error: 'This email belongs to an existing account or needs identity review. For an unlinked record, use its exact name and existing role.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const empId = typeof employee_id === 'string' && employee_id.trim() ? employee_id.trim().slice(0, 40) : null;
    if (empId) {
      const [{ data: dupStaff }, { data: dupInvite }] = await Promise.all([
        supabaseAdmin.from('school_teachers').select('id')
          .eq('school_id', schoolAdmin.school_id).ilike('employee_id', empId).maybeSingle(),
        supabaseAdmin.from('user_invites').select('id')
          .eq('school_id', schoolAdmin.school_id).ilike('employee_id', empId).is('accepted_at', null).maybeSingle(),
      ]);
      if (dupStaff || dupInvite) {
        return new Response(JSON.stringify({ error: 'That Employee ID is already used in your school' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Cancel any prior pending invite for the same email/school
    await supabaseAdmin
      .from('user_invites')
      .delete()
      .eq('school_id', schoolAdmin.school_id)
      .eq('email', email.trim().toLowerCase())
      .is('accepted_at', null)
      .is('target_teacher_id', null);

    // Get school name & inviter name
    const [{ data: school }, { data: inviter }] = await Promise.all([
      supabaseAdmin.from('schools').select('name').eq('id', schoolAdmin.school_id).single(),
      supabaseAdmin.from('school_admins').select('user_id').eq('user_id', callerUser.id).maybeSingle(),
    ]);
    const inviterName = callerUser.user_metadata?.full_name || callerUser.email || 'Your school admin';

    // Create invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('user_invites')
      .insert({
        email: email.trim().toLowerCase(),
        school_id: schoolAdmin.school_id,
        role,
        name: name.trim(),
        invited_by: callerUser.id,
        delivery_method,
        phone: phone?.trim() || null,
        employee_id: empId,
        assignments,
      })
      .select('id, token, expires_at')
      .single();

    if (inviteError || !invite) {
      console.error('Invite create error:', inviteError);
      if (/Conflicting invitation/i.test(inviteError?.message ?? '')) {
        return new Response(JSON.stringify({ error: 'An invitation to link an existing teacher is already pending for this email. Use Resend or Cancel.' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Failed to create invite' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inviteUrl = `${APP_URL}/auth/accept-invite?token=${invite.token}`;
    const roleLabel = role === 'accountant' ? 'Accountant' : 'Teacher';
    const schoolName = school?.name || 'your school';

    // Send Email
    let emailOk = true;
    if (delivery_method === 'email' || delivery_method === 'both') {
      const { error: emailErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'user-invite',
          recipientEmail: email.trim().toLowerCase(),
          idempotencyKey: `invite-${invite.id}`,
          templateData: {
            name: name.trim(),
            schoolName,
            roleLabel,
            inviteUrl,
            expiresInDays: 7,
            invitedByName: inviterName,
          },
        },
      });
      if (emailErr) {
        console.error('Email send error:', emailErr);
        emailOk = false;
      }
    }

    // Send WhatsApp
    let waOk = true;
    let waError: string | undefined;
    if ((delivery_method === 'whatsapp' || delivery_method === 'both') && phone) {
      const message = `Hi ${name.trim()}, you've been invited to join ${schoolName} on EdZen AI as a ${roleLabel}.\n\nSet your password & activate your account here:\n${inviteUrl}\n\n⏰ This link expires in 7 days.`;
      const r = await sendWhatsApp(phone, message, schoolName);
      waOk = r.ok;
      waError = r.error;
    }

    return new Response(JSON.stringify({
      success: true,
      inviteId: invite.id,
      expiresAt: invite.expires_at,
      delivery: { emailOk, waOk, waError },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
