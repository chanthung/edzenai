import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_TEMPLATE = `⚠️ ₹{amount} for {studentName} is due today.\n\nPay now:\n{parentLink}\n\n- {schoolName}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { school_id, phone, template, reminder_type } = body || {};
    if (!school_id || !phone) {
      return new Response(JSON.stringify({ error: 'school_id and phone required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Verify caller is an admin of this school
    const { data: adminRow } = await admin
      .from('school_admins')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('school_id', school_id)
      .maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: school } = await admin.from('schools').select('name').eq('id', school_id).maybeSingle();

    const waApiKey = Deno.env.get('WA_API_KEY');
    if (!waApiKey) {
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tpl = (template && String(template)) || DEFAULT_TEMPLATE;
    const message = tpl
      .replaceAll('{amount}', '5,000')
      .replaceAll('{studentName}', 'Test Student')
      .replaceAll('{dueDate}', new Date().toLocaleDateString('en-IN'))
      .replaceAll('{parentLink}', 'https://www.edzenai.com/view/test/sample')
      .replaceAll('{schoolName}', school?.name || 'School')
      + `\n\n[TEST: ${reminder_type || 'on'} reminder preview]`;

    const digits = String(phone).replace(/\D/g, '');
    const number = digits.length === 10 ? `91${digits}` : digits;

    const waResponse = await fetch('https://wp.mayaviinfotech.in/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: waApiKey,
        sender: '919366084335',
        number,
        message,
        footer: `Sent via ${school?.name || 'School'}`,
      }),
    });
    const waResult = await waResponse.json();
    if (!waResponse.ok || !waResult.status) {
      return new Response(JSON.stringify({ error: 'WhatsApp send failed', details: waResult }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_to: number }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
