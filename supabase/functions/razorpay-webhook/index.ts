import { createClient } from 'npm:@supabase/supabase-js@2';

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
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = await hmacSHA256(webhookSecret, body);
    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const notes = payment.notes || {};

      console.log('Payment captured:', payment.id, 'order:', orderId, 'notes:', notes);

      // Backup validation: if the subscription wasn't already activated via verify endpoint
      if (notes.schoolId && notes.userId) {
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('razorpay_order_id', orderId)
          .eq('payment_provider', 'razorpay')
          .single();

        if (!existing) {
          // Activate if not already done
          const now = new Date();
          const periodEnd = new Date(now);
          const billingCycle = notes.billingCycle || 'monthly';
          if (billingCycle === 'annual') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          await supabase.from('subscriptions').upsert({
            user_id: notes.userId,
            school_id: notes.schoolId,
            paddle_subscription_id: `rzp_${orderId}`,
            paddle_customer_id: `rzp_customer_${notes.userId}`,
            product_id: `${notes.plan || 'pro'}_plan`,
            price_id: `${notes.plan || 'pro'}_${billingCycle}`,
            status: 'active',
            quantity: parseInt(notes.studentCount) || 1,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            environment: 'live',
            payment_provider: 'razorpay',
            razorpay_order_id: orderId,
            razorpay_payment_id: payment.id,
            updated_at: now.toISOString(),
          }, {
            onConflict: 'user_id,environment,payment_provider',
          });

          await supabase.from('schools').update({
            subscription_status: 'active',
            subscription_plan: notes.plan || 'pro',
            billing_cycle: billingCycle,
            subscription_start_date: now.toISOString(),
            subscription_renewal_date: periodEnd.toISOString(),
            next_billing_date: periodEnd.toISOString(),
            payment_verified: true,
            payment_verified_at: now.toISOString(),
            system_state: 'subscription_active',
            updated_at: now.toISOString(),
          }).eq('id', notes.schoolId);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
