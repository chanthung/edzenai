
-- Subscription pricing table for platform-level defaults
CREATE TABLE public.subscription_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL UNIQUE,
  per_student_fee numeric NOT NULL DEFAULT 5,
  base_monthly_fee numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed defaults
INSERT INTO public.subscription_pricing (plan, per_student_fee, base_monthly_fee)
VALUES ('starter', 5, 0), ('pro', 8, 0);

-- Enable RLS
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything
CREATE POLICY "Platform admins can manage subscription pricing"
ON public.subscription_pricing FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- School admins can view pricing
CREATE POLICY "School admins can view subscription pricing"
ON public.subscription_pricing FOR SELECT
TO authenticated
USING (true);

-- Add custom pricing fields to schools
ALTER TABLE public.schools
  ADD COLUMN custom_per_student_fee numeric DEFAULT NULL,
  ADD COLUMN discount_percent numeric NOT NULL DEFAULT 0;
