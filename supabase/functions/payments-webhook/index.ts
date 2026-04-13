import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        console.log('Transaction completed:', event.data.id, 'env:', env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
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

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  const schoolId = customData?.schoolId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product.importMeta?.externalId || item.product.id;
  const quantity = item.quantity || 1;

  // Upsert subscription record
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    school_id: schoolId || null,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status: status,
    quantity: quantity,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,environment',
  });

  if (error) {
    console.error('Error upserting subscription:', error);
    return;
  }

  // Update school subscription status
  if (schoolId) {
    const plan = productId.includes('starter') ? 'starter' : 'pro';
    const billingCycle = priceId.includes('annual') ? 'annual' : 'monthly';
    
    await supabase.from('schools').update({
      subscription_status: 'active',
      subscription_plan: plan,
      billing_cycle: billingCycle,
      subscription_start_date: currentBillingPeriod?.startsAt || new Date().toISOString(),
      subscription_renewal_date: currentBillingPeriod?.endsAt,
      next_billing_date: currentBillingPeriod?.endsAt,
      payment_verified: true,
      payment_verified_at: new Date().toISOString(),
      system_state: 'subscription_active',
      updated_at: new Date().toISOString(),
    }).eq('id', schoolId);
  }

  console.log('Subscription created:', id, 'for user:', userId, 'school:', schoolId);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const quantity = items?.[0]?.quantity;

  const updateData: any = {
    status: status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };
  if (quantity) updateData.quantity = quantity;

  const { data: sub } = await supabase.from('subscriptions')
    .update(updateData)
    .eq('paddle_subscription_id', id)
    .eq('environment', env)
    .select('school_id')
    .single();

  // Update school dates
  if (sub?.school_id) {
    await supabase.from('schools').update({
      subscription_renewal_date: currentBillingPeriod?.endsAt,
      next_billing_date: currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    }).eq('id', sub.school_id);
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { data: sub } = await supabase.from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env)
    .select('school_id')
    .single();

  if (sub?.school_id) {
    await supabase.from('schools').update({
      subscription_status: 'canceled',
      system_state: 'restricted_mode',
      updated_at: new Date().toISOString(),
    }).eq('id', sub.school_id);
  }
}
