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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const waApiKey = Deno.env.get('WA_API_KEY');
    if (!waApiKey) {
      console.error('WA_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'WhatsApp not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const fiveDaysLater = new Date(today);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
    const fiveDaysLaterStr = fiveDaysLater.toISOString().split('T')[0];

    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Fetch installments due in 5 days, today, or yesterday (overdue)
    const { data: installments, error: instError } = await supabase
      .from('installments')
      .select(`
        id, name, amount, due_date,
        fee_structure:fee_structures(
          id, school_id,
          school:schools(name)
        )
      `)
      .in('due_date', [fiveDaysLaterStr, todayStr, yesterdayStr]);

    if (instError) {
      console.error('Error fetching installments:', instError);
      throw instError;
    }

    if (!installments || installments.length === 0) {
      console.log('No installments matching reminder dates');
      return new Response(JSON.stringify({ sent: 0, message: 'No reminders needed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const installment of installments) {
      const feeStructure = installment.fee_structure as any;
      if (!feeStructure) continue;

      const schoolName = feeStructure.school?.name || 'School';
      const feeStructureId = feeStructure.id;

      // Determine reminder type
      let reminderType: string;
      let emoji: string;
      let messageTemplate: string;

      if (installment.due_date === fiveDaysLaterStr) {
        reminderType = 'before';
        emoji = '📅';
        messageTemplate = `${emoji} Reminder: ₹{amount} for {studentName} is due on {dueDate}.\n\nView details & pay here:\n{parentLink}\n\n- ${schoolName}`;
      } else if (installment.due_date === todayStr) {
        reminderType = 'on';
        emoji = '⚠️';
        messageTemplate = `${emoji} ₹{amount} for {studentName} is due today.\n\nPay now:\n{parentLink}\n\n- ${schoolName}`;
      } else {
        reminderType = 'after';
        emoji = '🔴';
        messageTemplate = `${emoji} ₹{amount} for {studentName} is overdue.\n\nPlease pay at:\n{parentLink}\n\n- ${schoolName}`;
      }

      // Find students assigned to this fee structure who haven't fully paid this installment
      const { data: studentFees, error: sfError } = await supabase
        .from('student_fees')
        .select('student_id')
        .eq('fee_structure_id', feeStructureId);

      if (sfError || !studentFees) continue;

      const studentIds = studentFees.map(sf => sf.student_id);
      if (studentIds.length === 0) continue;

      // Fetch students with phone numbers
      const { data: students, error: studError } = await supabase
        .from('students')
        .select('id, name, parent_phone, access_token')
        .in('id', studentIds)
        .not('parent_phone', 'is', null);

      if (studError || !students) continue;

      for (const student of students) {
        if (!student.parent_phone?.trim()) continue;

        // Check if already paid this installment
        const { data: payments } = await supabase
          .from('payments')
          .select('amount_paid')
          .eq('student_id', student.id)
          .eq('installment_id', installment.id);

        const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount_paid), 0);
        if (totalPaid >= Number(installment.amount)) {
          skippedCount++;
          continue; // Already paid
        }

        // Check if reminder already sent
        const { data: existing } = await supabase
          .from('fee_reminder_logs')
          .select('id')
          .eq('student_id', student.id)
          .eq('installment_id', installment.id)
          .eq('reminder_type', reminderType)
          .maybeSingle();

        if (existing) {
          skippedCount++;
          continue; // Already sent
        }

        // Build parent link
        const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const parentLink = `https://www.edzenai.com/view/${firstName}/${student.access_token}`;

        const message = messageTemplate
          .replace('{amount}', Number(installment.amount).toLocaleString('en-IN'))
          .replace('{studentName}', student.name)
          .replace('{dueDate}', new Date(installment.due_date).toLocaleDateString('en-IN'))
          .replace('{parentLink}', parentLink);

        const digits = student.parent_phone.replace(/\D/g, '');
        const number = digits.length === 10 ? `91${digits}` : digits;

        try {
          const waResponse = await fetch('https://wp.mayaviinfotech.in/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: waApiKey,
              sender: '919436078446',
              number,
              message,
              footer: `Sent via ${schoolName}`,
            }),
          });

          const waResult = await waResponse.json();

          if (waResponse.ok && waResult.status) {
            // Log successful send
            await supabase.from('fee_reminder_logs').insert({
              student_id: student.id,
              installment_id: installment.id,
              reminder_type: reminderType,
            });
            sentCount++;
            console.log(`Sent ${reminderType} reminder to ${student.name} (${student.parent_phone})`);
          } else {
            console.error(`WhatsApp failed for ${student.name}:`, waResult);
          }
        } catch (err) {
          console.error(`Error sending to ${student.name}:`, err);
        }

        // Throttle between sends
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`Done. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ sent: sentCount, skipped: skippedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
