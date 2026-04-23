import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import {
  type LifecycleStage,
  NOTIFICATION_DAYS,
  getEmailSubject,
  getEmailBody,
  getWhatsAppMessage,
} from '../_shared/lifecycle-emails.ts';

const RENEW_URL = 'https://www.edzenai.com/pricing';

function computeStage(anchorDate: string | null): { stage: string; daysIntoExpiry: number } {
  if (!anchorDate) return { stage: 'trial_active', daysIntoExpiry: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - anchor.getTime()) / 86400000);

  if (days <= 0) return { stage: 'trial_active', daysIntoExpiry: 0 };
  if (days <= 15) return { stage: 'grace_period', daysIntoExpiry: days };
  if (days <= 30) return { stage: 'warning_phase', daysIntoExpiry: days };
  if (days <= 89) return { stage: 'suspended', daysIntoExpiry: days };
  return { stage: 'terminated', daysIntoExpiry: days };
}

function daysRemainingInStage(stage: string, daysIntoExpiry: number): number {
  switch (stage) {
    case 'grace_period': return 15 - daysIntoExpiry;
    case 'warning_phase': return 30 - daysIntoExpiry;
    case 'suspended': return 89 - daysIntoExpiry;
    case 'terminated': return 30; // restore window
    default: return 0;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const waApiKey = Deno.env.get('WA_API_KEY');

  try {
    // Fetch all schools with non-active subscriptions
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, email, phone, system_state, expiry_anchor_date, trial_end_date, subscription_renewal_date, payment_verified, subscription_status, terminated_at, scheduled_purge_at')
      .or('payment_verified.is.null,payment_verified.eq.false,subscription_status.neq.active');

    if (error) throw error;
    if (!schools) return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let transitions = 0;
    let notificationsQueued = 0;

    for (const school of schools) {
      // Determine anchor date
      const anchor = school.expiry_anchor_date || school.subscription_renewal_date || school.trial_end_date;
      if (!anchor) continue;

      // If anchor was missing on schools row, backfill it
      if (!school.expiry_anchor_date) {
        await supabase.from('schools').update({ expiry_anchor_date: anchor }).eq('id', school.id);
      }

      const { stage, daysIntoExpiry } = computeStage(anchor);
      const previousStage = school.system_state;

      // Skip if already active or trial still active
      if (stage === 'trial_active') continue;

      // Check if stage changed
      const stageChanged = previousStage !== stage;
      const updates: Record<string, any> = {};

      if (stageChanged) {
        updates.system_state = stage;
        updates.lifecycle_entered_at = new Date().toISOString();

        if (stage === 'terminated' && !school.terminated_at) {
          const terminatedAt = new Date();
          const purgeAt = new Date(terminatedAt);
          purgeAt.setDate(purgeAt.getDate() + 30);
          updates.terminated_at = terminatedAt.toISOString();
          updates.scheduled_purge_at = purgeAt.toISOString();
        }

        await supabase.from('schools').update(updates).eq('id', school.id);

        await supabase.from('subscription_lifecycle_logs').insert({
          school_id: school.id,
          from_stage: previousStage,
          to_stage: stage,
          reason: `Auto-transition: ${daysIntoExpiry} days past expiry`,
        });

        transitions++;
      }

      // Send notifications on configured trigger days
      const triggerDays = NOTIFICATION_DAYS[stage as LifecycleStage] || [];
      if (triggerDays.includes(daysIntoExpiry)) {
        // Idempotency check — already sent today for this stage/day?
        const { data: existing } = await supabase
          .from('subscription_lifecycle_logs')
          .select('id')
          .eq('school_id', school.id)
          .eq('to_stage', stage)
          .like('reason', `%notification day ${daysIntoExpiry}%`)
          .limit(1);

        if (!existing || existing.length === 0) {
          const ctx = {
            schoolName: school.name,
            daysIntoExpiry,
            daysRemainingInStage: daysRemainingInStage(stage, daysIntoExpiry),
            renewUrl: RENEW_URL,
          };

          // Send email via transactional email function (best-effort)
          if (school.email) {
            try {
              await supabase.functions.invoke('send-transactional-email', {
                body: {
                  to: school.email,
                  subject: getEmailSubject(stage as LifecycleStage, ctx),
                  text: getEmailBody(stage as LifecycleStage, ctx),
                  template_name: `lifecycle_${stage}`,
                },
              });
            } catch (e) {
              console.error(`Email failed for ${school.name}:`, e);
            }
          }

          // Send WhatsApp (best-effort)
          if (waApiKey && school.phone) {
            try {
              const digits = school.phone.replace(/\D/g, '');
              const number = digits.length === 10 ? `91${digits}` : digits;
              await fetch('https://wp.mayaviinfotech.in/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  api_key: waApiKey,
                  sender: '919366084335',
                  number,
                  message: getWhatsAppMessage(stage as LifecycleStage, ctx),
                  footer: 'EdZen AI',
                }),
              });
            } catch (e) {
              console.error(`WhatsApp failed for ${school.name}:`, e);
            }
          }

          await supabase.from('subscription_lifecycle_logs').insert({
            school_id: school.id,
            from_stage: stage,
            to_stage: stage,
            reason: `Sent notification day ${daysIntoExpiry}`,
          });

          notificationsQueued++;
        }
      }
    }

    console.log(`Lifecycle: ${transitions} transitions, ${notificationsQueued} notifications`);
    return new Response(
      JSON.stringify({ transitions, notificationsQueued, processed: schools.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Lifecycle error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
