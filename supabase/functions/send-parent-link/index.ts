import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWhatsApp, normalizeIndianPhone } from '../_shared/whatsapp.ts';
import { isSupportedParentLang, parentLinkMessage, type ParentLang } from '../_shared/parent-link-templates.ts';

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

  // Service-role client for reliable logging (bypasses RLS)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let dispatchId: string | null = null;

  const finalize = async (payload: Record<string, unknown>, status: number) => {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  const logFailure = async (message: string) => {
    if (!dispatchId) return;
    try {
      await adminClient
        .from('parent_link_dispatches')
        .update({ status: 'failed', error_message: message.slice(0, 500) })
        .eq('id', dispatchId);
    } catch (e) {
      console.error('[send-parent-link] log failure error', e);
    }
  };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return finalize({ success: false, error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return finalize({ success: false, error: 'Unauthorized' }, 401);
    }

    const { studentId }: SendLinkRequest = await req.json();
    if (!studentId) {
      return finalize({ success: false, error: 'Student ID is required' }, 400);
    }

    // Fetch student via user-scoped client (enforces RLS)
    const { data: student, error: studentError } = await userClient
      .from('students')
      .select('id, name, parent_phone, access_token, school_id, preferred_language')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return finalize({ success: false, error: 'Student not found or access denied' }, 404);
    }

    const normalizedPhone = normalizeIndianPhone(student.parent_phone);
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return finalize({
        success: false,
        failureKind: 'invalid_number',
        error: 'Parent phone number is missing or invalid. Please update the student profile with a valid 10-digit number.',
      }, 200);
    }

    // Create pending dispatch row
    const { data: dispatchRow, error: dispatchErr } = await adminClient
      .from('parent_link_dispatches')
      .insert({
        student_id: student.id,
        school_id: student.school_id,
        initiated_by: user.id,
        status: 'pending',
      })
      .select('id')
      .single();
    if (!dispatchErr && dispatchRow) dispatchId = dispatchRow.id;

    // Fetch school name
    const { data: school } = await adminClient
      .from('schools')
      .select('name')
      .eq('id', student.school_id)
      .single();

    const schoolName = school?.name ?? 'Your School';
    const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const parentLink = `https://www.edzenai.com/view/${firstName}/${student.access_token}`;
    const message = `Hello,\n\n${student.name}'s parent portal is ready. View fees, attendance & progress here:\n${parentLink}\n\n- ${schoolName}`;

    const result = await sendWhatsApp({
      toRaw: normalizedPhone,
      message,
      footer: `Sent via ${schoolName}`,
    });

    if (result.ok) {
      if (dispatchId) {
        await adminClient
          .from('parent_link_dispatches')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', dispatchId);
      }
      return finalize({
        success: true,
        message: `Link sent to +91 ${normalizedPhone}`,
        studentName: student.name,
      }, 200);
    }

    // Failed delivery — return 200 with structured error so UI can render gracefully
    let userError: string;
    if (result.failureKind === 'invalid_number') {
      userError = `WhatsApp could not deliver to +91 ${normalizedPhone}. The number is not registered on WhatsApp. Please verify the number with the parent.`;
    } else if (result.failureKind === 'config_error') {
      userError = 'WhatsApp service is not configured. Please contact support.';
    } else {
      userError = 'WhatsApp service is temporarily unavailable. Please retry in a moment.';
    }

    await logFailure(`${result.failureKind ?? 'unknown'}: ${result.providerMessage ?? ''}`);

    return finalize({
      success: false,
      failureKind: result.failureKind,
      error: userError,
      providerMessage: result.providerMessage,
      attempts: result.attempts,
    }, 200);
  } catch (error) {
    console.error('[send-parent-link] unexpected error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    await logFailure(`unexpected: ${msg}`);
    return finalize({ success: false, error: 'Internal server error' }, 500);
  }
});
