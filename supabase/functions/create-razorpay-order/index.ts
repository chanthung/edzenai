import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { schoolId, userId, plan, billingCycle, studentCount } = await req.json();

    if (!schoolId || !userId || !plan || !billingCycle || !studentCount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch pricing from DB
    const { data: pricing } = await supabase
      .from('subscription_pricing')
      .select('per_student_fee')
      .eq('plan', plan)
      .single();

    if (!pricing) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate amount
    let monthlyAmount = pricing.per_student_fee * studentCount;

    // Apply volume discount
    const { data: tiers } = await supabase
      .from('volume_discount_tiers')
      .select('*')
      .order('min_students', { ascending: true });

    if (tiers) {
      for (const tier of tiers) {
        if (studentCount >= tier.min_students &&
          (tier.max_students === null || studentCount <= tier.max_students)) {
          monthlyAmount = monthlyAmount - (monthlyAmount * tier.discount_percent / 100);
          break;
        }
      }
    }

    // Apply annual discount (10% off)
    if (billingCycle === 'annual') {
      monthlyAmount = monthlyAmount * 0.9;
    }

    // For annual billing, charge the full year upfront
    const totalAmount = billingCycle === 'annual' ? monthlyAmount * 12 : monthlyAmount;

    // Amount in paise
    const amountInPaise = Math.round(totalAmount * 100);

    // Minimum ₹1 (100 paise)
    if (amountInPaise < 100) {
      return new Response(JSON.stringify({ error: 'Amount too low' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Create Razorpay order
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `sub_${schoolId}_${Date.now()}`,
        notes: {
          schoolId,
          userId,
          plan,
          billingCycle,
          studentCount: String(studentCount),
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errText = await rzpResponse.text();
      console.error('Razorpay order creation failed:', errText);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order = await rzpResponse.json();

    return new Response(JSON.stringify({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    }), {
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
