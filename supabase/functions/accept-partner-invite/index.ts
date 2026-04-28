import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);

    // GET → validate token
    if (req.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response(JSON.stringify({ error: 'token required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: invite } = await supabaseAdmin
        .from('partner_invites')
        .select('id, email, name, partner_id, expires_at, accepted_at')
        .eq('token', token)
        .maybeSingle();

      if (!invite) {
        return new Response(JSON.stringify({ valid: false, reason: 'invalid' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (invite.accepted_at) {
        return new Response(JSON.stringify({ valid: false, reason: 'used' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (new Date(invite.expires_at) < new Date()) {
        return new Response(JSON.stringify({ valid: false, reason: 'expired' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('referral_code, commission_percent')
        .eq('id', invite.partner_id)
        .single();

      return new Response(JSON.stringify({
        valid: true,
        email: invite.email,
        name: invite.name,
        referralCode: partner?.referral_code,
        commissionPercent: partner?.commission_percent,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST → accept
    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'token and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: invite } = await supabaseAdmin
      .from('partner_invites').select('*').eq('token', token).maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invalid invite' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (invite.accepted_at) {
      return new Response(JSON.stringify({ error: 'Invite already accepted' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invite has expired' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invite.name },
    });

    if (authErr || !authData?.user) {
      console.error('Create user error:', authErr);
      return new Response(JSON.stringify({ error: authErr?.message || 'Failed to create account' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user.id;

    // Assign 'partner' role
    const { error: roleErr } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUserId,
      role: 'partner',
    });
    if (roleErr) {
      console.error('Role assign error:', roleErr);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Link partner to user
    const { error: linkErr } = await supabaseAdmin
      .from('partners')
      .update({ user_id: newUserId })
      .eq('id', invite.partner_id);

    if (linkErr) {
      console.error('Partner link error:', linkErr);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to link partner' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark invite accepted
    await supabaseAdmin
      .from('partner_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return new Response(JSON.stringify({
      success: true,
      email: invite.email,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
