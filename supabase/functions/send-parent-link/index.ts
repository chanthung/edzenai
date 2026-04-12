import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendLinkRequest {
  studentId: string;
}

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

    const { studentId }: SendLinkRequest = await req.json();
    if (!studentId) {
      return new Response(
        JSON.stringify({ error: 'Student ID is required' }),
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
        JSON.stringify({ error: 'Student not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!student.parent_phone?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Parent phone number is missing for this student' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch school name
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('name')
      .eq('id', student.school_id)
      .single();

    if (schoolError || !school) {
      return new Response(
        JSON.stringify({ error: 'School not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build parent link
    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const parentLink = `https://www.edzenai.com/view/${firstName}/${student.access_token}`;

    // Get WhatsApp API key
    const waApiKey = Deno.env.get('WA_API_KEY');
    if (!waApiKey) {
      console.error('WA_API_KEY secret not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build WhatsApp message
    const message = `Hello,\n\n${student.name}'s parent portal is ready. View fees, attendance & progress here:\n${parentLink}\n\n- ${school.name}`;

    const payload = {
      api_key: waApiKey,
      sender: '919366084335',
      number: (() => {
        const digits = student.parent_phone.replace(/\D/g, '');
        // If 10 digits (Indian local number), prepend 91
        return digits.length === 10 ? `91${digits}` : digits;
      })(),
      message,
      footer: `Sent via ${school.name}`,
    };

    console.log('Sending WhatsApp message to:', student.parent_phone);

    // Retry up to 2 times on transient failures
    let waResult: any = null;
    let waOk = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const waResponse = await fetch('https://wp.mayaviinfotech.in/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        waResult = await waResponse.json();
        if (waResponse.ok && waResult.status) {
          waOk = true;
          break;
        }
        console.error(`WhatsApp attempt ${attempt} failed:`, waResponse.status, JSON.stringify(waResult));
      } catch (fetchErr) {
        console.error(`WhatsApp attempt ${attempt} network error:`, fetchErr);
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
    }

    if (!waOk) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp delivery failed. The service may be temporarily unavailable — please try again in a moment.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Link sent to ${student.parent_phone}`,
        studentName: student.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
