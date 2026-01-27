import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendLinkRequest {
  studentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user auth
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Auth validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Request from user:', userId);

    // Parse request body
    const { studentId }: SendLinkRequest = await req.json();
    if (!studentId) {
      return new Response(
        JSON.stringify({ error: 'Student ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending link for student:', studentId);

    // Fetch student details (RLS will ensure user can only access their school's students)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, parent_phone, access_token, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Failed to fetch student:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate parent phone
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
      console.error('Failed to fetch school:', schoolError);
      return new Response(
        JSON.stringify({ error: 'School not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the parent link URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '');
    // Use the app's published URL or preview URL
    const parentLink = `https://easykiwi.lovable.app/view/${student.access_token}`;

    // Get n8n webhook URL from secrets
    const n8nWebhookUrl = Deno.env.get('N8N_PARENT_LINK_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_PARENT_LINK_WEBHOOK_URL secret not configured');
      return new Response(
        JSON.stringify({ error: 'Messaging service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payload for n8n
    const payload = {
      studentName: student.name,
      parentPhone: student.parent_phone,
      parentLink: parentLink,
      schoolName: school.name,
      studentId: student.id,
      timestamp: new Date().toISOString(),
    };

    console.log('Calling n8n webhook with payload:', JSON.stringify(payload));

    // Call n8n webhook
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('n8n webhook failed:', n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send message via automation service' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('n8n webhook called successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Link sent to ${student.parent_phone}`,
        studentName: student.name 
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
