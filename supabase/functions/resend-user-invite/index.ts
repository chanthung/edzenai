import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://edzenai.com';

async function sendWhatsApp(phone: string, message: string, schoolName: string) {
  const waApiKey = Deno.env.get('WHATSAPP_API_KEY');
  if (!waApiKey) return { ok: false };
  const digits = phone.replace(/\D/g, '');
  const number = digits.length === 10 ? `91${digits}` : digits;
  const payload = { api_key: waApiKey, sender: '919366084335', number, message, footer: `Sent via ${schoolName}` };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://wp.mayaviinfotech.in/send-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.status) return { ok: true };
    } catch (err) { console.error('WA error', err); }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
  }
  return { ok: false };
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

    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();
    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: schoolAdmin } = await supabaseAdmin
      .from('school_admins').select('school_id').eq('user_id', callerUser.id).maybeSingle();
    if (!schoolAdmin) {
      return new Response(JSON.stringify({ error: 'Only school admins can resend invites' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { inviteId } = await req.json();
    if (!inviteId) {
      return new Response(JSON.stringify({ error: 'inviteId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('user_invites').select('*').eq('id', inviteId).eq('school_id', schoolAdmin.school_id).maybeSingle();

    if (fetchErr || !existing) {
      return new Response(JSON.stringify({ error: 'Invite not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existing.accepted_at) {
      return new Response(JSON.stringify({ error: 'Invite already accepted' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Regenerate token & extend expiry
    const newToken = crypto.randomUUID();
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('user_invites')
      .update({ token: newToken, expires_at: newExpiry, last_sent_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Failed to refresh invite' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: school } = await supabaseAdmin.from('schools').select('name').eq('id', existing.school_id).single();
    const schoolName = school?.name || 'your school';
    const roleLabel = existing.role === 'accountant' ? 'Accountant' : 'Teacher';
    const inviteUrl = `${APP_URL}/auth/accept-invite?token=${newToken}`;
    const inviterName = callerUser.user_metadata?.full_name || callerUser.email || 'Your school admin';

    if (existing.delivery_method === 'email' || existing.delivery_method === 'both') {
      await supabaseAdmin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'user-invite',
          recipientEmail: existing.email,
          idempotencyKey: `invite-resend-${inviteId}-${Date.now()}`,
          templateData: { name: existing.name, schoolName, roleLabel, inviteUrl, expiresInDays: 7, invitedByName: inviterName },
        },
      });
    }

    if ((existing.delivery_method === 'whatsapp' || existing.delivery_method === 'both') && existing.phone) {
      const message = `Hi ${existing.name}, here's your fresh invite link to join ${schoolName} on EdZen AI as a ${roleLabel}:\n${inviteUrl}\n\n⏰ Expires in 7 days.`;
      await sendWhatsApp(existing.phone, message, schoolName);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
