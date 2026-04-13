
-- Add payment_provider column
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'paddle';

-- Add razorpay-specific fields (nullable, only used for razorpay)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;

-- Drop old unique constraint and create a new one including payment_provider
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_environment_key;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_environment_provider_key
  UNIQUE (user_id, environment, payment_provider);
