import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Content-Type": "application/json",
  },
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, responseHeaders);
  }

  try {
    // Verify caller is platform admin
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ...responseHeaders });
      }
      const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'platform_admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Not a platform admin' }), { status: 403, ...responseHeaders });
      }
    }

    // Get current pricing from DB
    const { data: pricing, error: pricingError } = await supabase
      .from('subscription_pricing')
      .select('*');
    
    if (pricingError) throw pricingError;

    const results: any[] = [];
    const env: PaddleEnv = 'sandbox'; // Always update test env; live syncs on publish

    for (const plan of pricing || []) {
      const monthlyAmount = Math.round(plan.per_student_fee * 100); // Convert to paise
      const annualAmount = Math.round(plan.per_student_fee * 12 * 0.9 * 100); // 10% annual discount
      
      const priceIds = [
        { externalId: `${plan.plan}_monthly`, amount: monthlyAmount },
        { externalId: `${plan.plan}_annual`, amount: annualAmount },
      ];

      for (const { externalId, amount } of priceIds) {
        // Look up Paddle price by external_id
        const lookupRes = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(externalId)}`);
        const lookupData = await lookupRes.json();
        
        if (lookupData.data?.length > 0) {
          const paddlePriceId = lookupData.data[0].id;
          const currentAmount = parseInt(lookupData.data[0].unit_price?.amount || '0');
          
          if (currentAmount !== amount) {
            // Update the price in Paddle
            const updateRes = await gatewayFetch(env, `/prices/${paddlePriceId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                unit_price: {
                  amount: String(amount),
                  currency_code: 'INR',
                },
              }),
            });
            const updateData = await updateRes.json();
            results.push({ 
              priceId: externalId, 
              action: 'updated', 
              from: currentAmount, 
              to: amount,
              success: !updateData.error,
            });
          } else {
            results.push({ priceId: externalId, action: 'unchanged', amount });
          }
        } else {
          results.push({ priceId: externalId, action: 'not_found' });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), responseHeaders);
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, ...responseHeaders });
  }
});
