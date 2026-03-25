import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendLinkRequest {
  studentId: string;
}

interface DispatchClaimResult {
  dispatch_id: string;
  is_duplicate: boolean;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let dispatchId: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('Required backend environment variables are missing');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth validation failed:', claimsError);
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const userId = claimsData.claims.sub;
    const { studentId }: SendLinkRequest = await req.json();

    if (!studentId) {
      return jsonResponse({ error: 'Student ID is required' }, 400);
    }

    console.log('Sending link for student:', studentId, 'requested by:', userId);

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, parent_phone, access_token, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Failed to fetch student:', studentError);
      return jsonResponse({ error: 'Student not found or access denied' }, 404);
    }

    if (!student.parent_phone?.trim()) {
      return jsonResponse({ error: 'Parent phone number is missing for this student' }, 400);
    }

    const { data: dispatchClaim, error: dispatchClaimError } = await adminSupabase
      .rpc('claim_parent_link_dispatch', {
        _student_id: student.id,
        _school_id: student.school_id,
        _initiated_by: userId,
        _window_seconds: 120,
      })
      .single<DispatchClaimResult>();

    if (dispatchClaimError || !dispatchClaim) {
      console.error('Failed to claim parent link dispatch:', dispatchClaimError);
      return jsonResponse({ error: 'Could not create send lock' }, 500);
    }

    dispatchId = dispatchClaim.dispatch_id;

    if (dispatchClaim.is_duplicate) {
      console.log('Duplicate send blocked for student:', student.id, 'dispatch:', dispatchId);
      return jsonResponse({
        success: true,
        duplicate: true,
        message: `Link was already sent recently to ${student.parent_phone}`,
        studentName: student.name,
      });
    }

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('name')
      .eq('id', student.school_id)
      .single();

    if (schoolError || !school) {
      console.error('Failed to fetch school:', schoolError);
      await adminSupabase
        .from('parent_link_dispatches')
        .update({ status: 'failed', error_message: 'School not found' })
        .eq('id', dispatchId);
      return jsonResponse({ error: 'School not found' }, 404);
    }

    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const parentLink = `https://easykiwi.lovable.app/view/${firstName}/${student.access_token}`;

    const n8nWebhookUrl = Deno.env.get('N8N_PARENT_LINK_WEBHOOK_URL');
    if (!n8nWebhookUrl) {
      console.error('N8N_PARENT_LINK_WEBHOOK_URL secret not configured');
      await adminSupabase
        .from('parent_link_dispatches')
        .update({ status: 'failed', error_message: 'Messaging service not configured' })
        .eq('id', dispatchId);
      return jsonResponse({ error: 'Messaging service not configured' }, 500);
    }

    const payload = {
      dispatchId,
      studentName: student.name,
      parentPhone: student.parent_phone,
      parentLink,
      schoolName: school.name,
      studentId: student.id,
      timestamp: new Date().toISOString(),
    };

    console.log('Calling n8n webhook with payload:', JSON.stringify(payload));

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
      await adminSupabase
        .from('parent_link_dispatches')
        .update({
          status: 'failed',
          error_message: `Webhook failed with status ${n8nResponse.status}`,
        })
        .eq('id', dispatchId);
      return jsonResponse({ error: 'Failed to send message via automation service' }, 502);
    }

    await adminSupabase
      .from('parent_link_dispatches')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', dispatchId);

    console.log('n8n webhook called successfully for dispatch:', dispatchId);

    return jsonResponse({
      success: true,
      message: `Link sent to ${student.parent_phone}`,
      studentName: student.name,
    });
  } catch (error) {
    console.error('Unexpected error:', error);

    if (dispatchId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseServiceRoleKey) {
        const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);
        await adminSupabase
          .from('parent_link_dispatches')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unexpected error',
          })
          .eq('id', dispatchId);
      }
    }

    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
