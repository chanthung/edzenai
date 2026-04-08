import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { studentId, amount } = body;

    if (!studentId || !amount) {
      return new Response(
        JSON.stringify({ error: 'studentId and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, parent_phone, access_token, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'Student not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!student.parent_phone?.trim()) {
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'No parent phone' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch school name
    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', student.school_id)
      .single();

    const schoolName = school?.name || 'School';

    // Build parent link
    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const parentLink = `https://www.edzenai.com/view/${firstName}/${student.access_token}`;

    // Format amount
    const formattedAmount = Number(amount).toLocaleString('en-IN');

    const message = `✅ Payment of ₹${formattedAmount} received for ${student.name}.\n\nView updated fee details here:\n${parentLink}\n\n- ${schoolName}`;

    const waApiKey = Deno.env.get('WA_API_KEY');
    if (!waApiKey) {
      console.error('WA_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, reason: 'WhatsApp not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const digits = student.parent_phone.replace(/\D/g, '');
    const number = digits.length === 10 ? `91${digits}` : digits;

    const waResponse = await fetch('https://wp.mayaviinfotech.in/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: waApiKey,
        sender: '919366084335',
        number,
        message,
        footer: `Sent via ${schoolName}`,
      }),
    });

    const waResult = await waResponse.json();

    if (!waResponse.ok || !waResult.status) {
      console.error('WhatsApp send failed:', JSON.stringify(waResult));
      return new Response(
        JSON.stringify({ success: false, reason: 'WhatsApp send failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Payment confirmation sent to', student.parent_phone);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
