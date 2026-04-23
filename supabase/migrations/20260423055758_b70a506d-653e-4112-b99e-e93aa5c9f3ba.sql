
-- Step 1: Add new enum values (must be committed before use)
ALTER TYPE school_system_state ADD VALUE IF NOT EXISTS 'grace_period';
ALTER TYPE school_system_state ADD VALUE IF NOT EXISTS 'warning_phase';
ALTER TYPE school_system_state ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE school_system_state ADD VALUE IF NOT EXISTS 'terminated';

-- Step 2: Add lifecycle tracking columns to schools
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS expiry_anchor_date date,
  ADD COLUMN IF NOT EXISTS lifecycle_entered_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_purge_at timestamptz;

-- Step 3: Backfill expiry_anchor_date from trial_end_date or subscription_renewal_date
UPDATE public.schools
SET expiry_anchor_date = COALESCE(subscription_renewal_date, trial_end_date)
WHERE expiry_anchor_date IS NULL
  AND (trial_end_date IS NOT NULL OR subscription_renewal_date IS NOT NULL);

-- Step 4: Lifecycle audit log
CREATE TABLE IF NOT EXISTS public.subscription_lifecycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  from_stage text,
  to_stage text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_logs_school ON public.subscription_lifecycle_logs(school_id, created_at DESC);

ALTER TABLE public.subscription_lifecycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view lifecycle logs"
  ON public.subscription_lifecycle_logs FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "School admins can view their lifecycle logs"
  ON public.subscription_lifecycle_logs FOR SELECT
  USING (school_id IN (SELECT public.get_user_school_ids()));

CREATE POLICY "Service role can manage lifecycle logs"
  ON public.subscription_lifecycle_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 5: Helper function — compute lifecycle stage from anchor date
CREATE OR REPLACE FUNCTION public.compute_lifecycle_stage(_anchor_date date)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _anchor_date IS NULL THEN 'trial_active'
    WHEN CURRENT_DATE <= _anchor_date THEN 'trial_active'
    WHEN CURRENT_DATE - _anchor_date BETWEEN 1 AND 15 THEN 'grace_period'
    WHEN CURRENT_DATE - _anchor_date BETWEEN 16 AND 30 THEN 'warning_phase'
    WHEN CURRENT_DATE - _anchor_date BETWEEN 31 AND 89 THEN 'suspended'
    ELSE 'terminated'
  END;
$$;
