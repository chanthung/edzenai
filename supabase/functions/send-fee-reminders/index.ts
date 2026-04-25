import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ReminderKey = 'before_7d' | 'before_3d' | 'on' | 'after_1d' | 'after_7d';

const DEFAULT_TEMPLATES: Record<ReminderKey, string> = {
  before_7d: `📅 Friendly reminder: ₹{amount} for {studentName} is due in 1 week on {dueDate}.\n\nView & pay here:\n{parentLink}\n\n- {schoolName}`,
  before_3d: `⏰ Reminder: ₹{amount} for {studentName} is due in 3 days on {dueDate}.\n\nPay here:\n{parentLink}\n\n- {schoolName}`,
  on: `⚠️ ₹{amount} for {studentName} is due today.\n\nPay now:\n{parentLink}\n\n- {schoolName}`,
  after_1d: `🔴 ₹{amount} for {studentName} is overdue (was due yesterday).\n\nPlease pay at:\n{parentLink}\n\n- {schoolName}`,
  after_7d: `🔴 Final reminder: ₹{amount} for {studentName} is 1 week overdue.\n\nPlease pay immediately:\n{parentLink}\n\n- {schoolName}`,
};

const OFFSETS: Record<ReminderKey, number> = {
  before_7d: 7,
  before_3d: 3,
  on: 0,
  after_1d: -1,
  after_7d: -7,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const waApiKey = Deno.env.get('WA_API_KEY');
    if (!waApiKey) {
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute current IST hour
    const url = new URL(req.url);
    const forceHour = url.searchParams.get('force_hour');
    const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const istHour = forceHour !== null ? Number(forceHour) : nowIst.getUTCHours();

    // Fetch all schools with reminders enabled at this hour
    const { data: settingsRows, error: setErr } = await supabase
      .from('school_reminder_settings')
      .select('school_id, enabled, send_hour_ist, offsets_enabled, templates')
      .eq('enabled', true)
      .eq('send_hour_ist', istHour);

    if (setErr) throw setErr;
    if (!settingsRows || settingsRows.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: `No schools scheduled for IST hour ${istHour}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date(nowIst);
    const todayStr = today.toISOString().split('T')[0];
    const dateOffset = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    let sentCount = 0;
    let skippedCount = 0;

    for (const settings of settingsRows) {
      const schoolId = settings.school_id;
      const offsetsEnabled = (settings.offsets_enabled || {}) as Record<ReminderKey, boolean>;
      const customTemplates = (settings.templates || {}) as Partial<Record<ReminderKey, string>>;

      // Build map of due_date -> reminderKey for this school's enabled offsets
      const dateToKey: Record<string, ReminderKey> = {};
      (Object.keys(OFFSETS) as ReminderKey[]).forEach((k) => {
        if (offsetsEnabled[k] !== false) {
          dateToKey[dateOffset(OFFSETS[k])] = k;
        }
      });
      const targetDates = Object.keys(dateToKey);
      if (targetDates.length === 0) continue;

      // Fetch installments for this school matching target dates
      const { data: installments, error: instError } = await supabase
        .from('installments')
        .select(`id, name, amount, due_date,
          fee_structure:fee_structures!inner(id, school_id, school:schools(name))`)
        .in('due_date', targetDates)
        .eq('fee_structure.school_id', schoolId);

      if (instError || !installments) continue;

      for (const installment of installments) {
        const fs = installment.fee_structure as any;
        if (!fs) continue;
        const schoolName = fs.school?.name || 'School';
        const reminderType = dateToKey[installment.due_date];
        if (!reminderType) continue;

        const template = customTemplates[reminderType] || DEFAULT_TEMPLATES[reminderType];

        // Students assigned to this fee structure
        const { data: studentFees } = await supabase
          .from('student_fees')
          .select('student_id')
          .eq('fee_structure_id', fs.id);

        const studentIds = (studentFees || []).map((sf: any) => sf.student_id);
        if (studentIds.length === 0) continue;

        const { data: students } = await supabase
          .from('students')
          .select('id, name, parent_phone, access_token')
          .in('id', studentIds)
          .not('parent_phone', 'is', null);

        for (const student of students || []) {
          if (!student.parent_phone?.trim()) continue;

          const { data: payments } = await supabase
            .from('payments')
            .select('amount_paid')
            .eq('student_id', student.id)
            .eq('installment_id', installment.id);

          const totalPaid = (payments || []).reduce((s: number, p: any) => s + Number(p.amount_paid), 0);
          if (totalPaid >= Number(installment.amount)) { skippedCount++; continue; }

          const { data: existing } = await supabase
            .from('fee_reminder_logs')
            .select('id')
            .eq('student_id', student.id)
            .eq('installment_id', installment.id)
            .eq('reminder_type', reminderType)
            .maybeSingle();
          if (existing) { skippedCount++; continue; }

          const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const parentLink = `https://www.edzenai.com/view/${firstName}/${student.access_token}`;

          const message = template
            .replaceAll('{amount}', Number(installment.amount).toLocaleString('en-IN'))
            .replaceAll('{studentName}', student.name)
            .replaceAll('{dueDate}', new Date(installment.due_date).toLocaleDateString('en-IN'))
            .replaceAll('{parentLink}', parentLink)
            .replaceAll('{schoolName}', schoolName);

          const digits = student.parent_phone.replace(/\D/g, '');
          const number = digits.length === 10 ? `91${digits}` : digits;

          try {
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
            if (waResponse.ok && waResult.status) {
              await supabase.from('fee_reminder_logs').insert({
                student_id: student.id,
                installment_id: installment.id,
                reminder_type: reminderType,
              });
              sentCount++;
            } else {
              console.error(`WhatsApp failed for ${student.name}:`, waResult);
            }
          } catch (err) {
            console.error(`Error sending to ${student.name}:`, err);
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    console.log(`Done. Hour=${istHour} IST. Sent: ${sentCount}, Skipped: ${skippedCount}`);
    return new Response(JSON.stringify({ sent: sentCount, skipped: skippedCount, hour_ist: istHour }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
