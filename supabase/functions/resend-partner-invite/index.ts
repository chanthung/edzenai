import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://www.edzenai.com';

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

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: caller.id,
      _role: 'platform_admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Only platform admins can resend partner invites' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const partnerId: string = body.partner_id;
    if (!partnerId) {
      return new Response(JSON.stringify({ error: 'partner_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get partner info
    const { data: partner, error: partnerErr } = await supabaseAdmin
      .from('partners')
      .select('id, name, email, user_id')
      .eq('id', partnerId)
      .maybeSingle();

    if (partnerErr || !partner) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (partner.user_id) {
      return new Response(JSON.stringify({ error: 'Partner has already accepted the invite' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find existing invite
    const { data: existingInvite } = await supabaseAdmin
      .from('partner_invites')
      .select('id, token, expires_at, accepted_at')
      .eq('partner_id', partnerId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let inviteToken: string;

    if (existingInvite) {
      const isExpired = new Date(existingInvite.expires_at) < new Date();
      if (isExpired) {
        // Create a new invite row with fresh token and expiry
        const { data: newInvite, error: newErr } = await supabaseAdmin
          .from('partner_invites')
          .insert({
            partner_id: partnerId,
            email: partner.email,
            name: partner.name,
            invited_by: caller.id,
          })
          .select('token')
          .single();
        if (newErr || !newInvite) {
          return new Response(JSON.stringify({ error: 'Failed to create new invite' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        inviteToken = newInvite.token;
      } else {
        // Update last_sent_at
        await supabaseAdmin
          .from('partner_invites')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('id', existingInvite.id);
        inviteToken = existingInvite.token;
      }
    } else {
      // No invite exists, create one
      const { data: newInvite, error: newErr } = await supabaseAdmin
        .from('partner_invites')
        .insert({
          partner_id: partnerId,
          email: partner.email,
          name: partner.name,
          invited_by: caller.id,
        })
        .select('token')
        .single();
      if (newErr || !newInvite) {
        return new Response(JSON.stringify({ error: 'Failed to create invite' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      inviteToken = newInvite.token;
    }

    const inviteUrl = `${APP_URL}/auth/accept-partner-invite?token=${inviteToken}`;
    const inviterName = caller.user_metadata?.full_name || caller.email || 'EdZen AI Team';

    const { error: emailErr } = await supabaseAdmin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'user-invite',
        recipientEmail: partner.email,
        idempotencyKey: `partner-resend-${partnerId}-${Date.now()}`,
        templateData: {
          name: partner.name,
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
