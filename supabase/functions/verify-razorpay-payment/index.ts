import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function hmacSHA256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      schoolId,
      userId,
      plan,
      billingCycle,
      studentCount,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const expectedSignature = await hmacSHA256(
      keySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`
    );

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Signature valid — activate subscription
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert subscription record
    const { error: subError } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      school_id: schoolId || null,
      paddle_subscription_id: `rzp_${razorpay_order_id}`,
      paddle_customer_id: `rzp_customer_${userId}`,
      product_id: `${plan}_plan`,
      price_id: `${plan}_${billingCycle}`,
      status: 'active',
      quantity: studentCount || 1,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      environment: 'live',
      payment_provider: 'razorpay',
      razorpay_order_id,
      razorpay_payment_id,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'user_id,environment,payment_provider',
    });

    if (subError) {
      console.error('Error upserting subscription:', subError);
      return new Response(JSON.stringify({ error: 'Failed to activate subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update school status — clears all lifecycle fields on renewal
    if (schoolId) {
      const periodEndDate = periodEnd.toISOString().split('T')[0];
      await supabase.from('schools').update({
        subscription_status: 'active',
        subscription_plan: plan,
        billing_cycle: billingCycle,
        subscription_start_date: now.toISOString(),
        subscription_renewal_date: periodEndDate,
        next_billing_date: periodEndDate,
        payment_verified: true,
        payment_verified_at: now.toISOString(),
        system_state: 'subscription_active',
        // Reset lifecycle on successful renewal
        expiry_anchor_date: periodEndDate,
        terminated_at: null,
        scheduled_purge_at: null,
        lifecycle_entered_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).eq('id', schoolId);

      // Log the lifecycle reset
      await supabase.from('subscription_lifecycle_logs').insert({
        school_id: schoolId,
        from_stage: null,
        to_stage: 'subscription_active',
        reason: `Renewed via Razorpay (${billingCycle}) — anchor date ${periodEndDate}`,
      });
    }

    console.log('Razorpay payment verified:', razorpay_payment_id, 'school:', schoolId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
