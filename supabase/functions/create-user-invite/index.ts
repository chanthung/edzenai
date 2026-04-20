import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const {
      name,
      email,
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

    // Check for existing active user with this email in this school
    const { data: existingTeacher } = await supabaseAdmin
      .from('school_teachers')
      .select('id')
      .eq('school_id', schoolAdmin.school_id)
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingTeacher) {
      return new Response(JSON.stringify({ error: 'A user with this email already exists in your school' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cancel any prior pending invite for the same email/school
    await supabaseAdmin
      .from('user_invites')
      .delete()
      .eq('school_id', schoolAdmin.school_id)
      .eq('email', email.trim().toLowerCase())
      .is('accepted_at', null);

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
        assignments,
      })
      .select('id, token, expires_at')
      .single();

    if (inviteError || !invite) {
      console.error('Invite create error:', inviteError);
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
