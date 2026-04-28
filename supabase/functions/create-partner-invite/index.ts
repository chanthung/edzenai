import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://www.edzenai.com';

function generateCode(name: string) {
  const base = (name || 'PARTNER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PART';
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}${suffix}`;
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

    const { data: { user: caller }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify platform admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: caller.id,
      _role: 'platform_admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Only platform admins can create partners' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const name: string = (body.name || '').trim();
    const email: string = (body.email || '').trim().toLowerCase();
    const phone: string | null = body.phone?.trim() || null;
    const referralCode: string = (body.referral_code || '').trim().toUpperCase() || generateCode(name);
    const commissionPercent: number = parseFloat(body.commission_percent ?? '20');

    if (!name || !email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      return new Response(JSON.stringify({ error: 'Commission % must be 0-100' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for existing partner with this email
    const { data: existing } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ error: 'A partner with this email already exists' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check referral code uniqueness
    const { data: codeExists } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle();
    if (codeExists) {
      return new Response(JSON.stringify({ error: `Referral code "${referralCode}" already in use` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create partner row (no user_id yet; linked on accept)
    const { data: partner, error: partnerErr } = await supabaseAdmin
      .from('partners')
      .insert({
        name,
        email,
        phone,
        referral_code: referralCode,
        commission_percent: commissionPercent,
        is_active: true,
      })
      .select('id, referral_code')
      .single();

    if (partnerErr || !partner) {
      console.error('Partner create error:', partnerErr);
      return new Response(JSON.stringify({ error: 'Failed to create partner' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create invite
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('partner_invites')
      .insert({
        partner_id: partner.id,
        email,
        name,
        invited_by: caller.id,
      })
      .select('id, token, expires_at')
      .single();

    if (inviteErr || !invite) {
      console.error('Invite error:', inviteErr);
      // Clean up partner row
      await supabaseAdmin.from('partners').delete().eq('id', partner.id);
      return new Response(JSON.stringify({ error: 'Failed to create invite' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inviteUrl = `${APP_URL}/auth/accept-partner-invite?token=${invite.token}`;
    const inviterName = caller.user_metadata?.full_name || caller.email || 'EdZen AI Team';

    // Send invite email (reuse existing user-invite template)
    const { error: emailErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'user-invite',
        recipientEmail: email,
        idempotencyKey: `partner-invite-${invite.id}`,
        templateData: {
          name,
          schoolName: 'EdZen AI Partner Program',
          roleLabel: 'Partner',
          inviteUrl,
          expiresInDays: 7,
          invitedByName: inviterName,
        },
      },
    });
    if (emailErr) {
      console.error('Email send error:', emailErr);
    }

    return new Response(JSON.stringify({
      success: true,
      partnerId: partner.id,
      referralCode: partner.referral_code,
      inviteId: invite.id,
      expiresAt: invite.expires_at,
      emailSent: !emailErr,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
