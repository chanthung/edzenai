
-- Rewrite get_school_effective_state to use lifecycle stages
CREATE OR REPLACE FUNCTION public.get_school_effective_state(_school_id uuid)
RETURNS school_system_state
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  stage text;
BEGIN
  SELECT payment_verified, subscription_status, trial_end_date,
         subscription_renewal_date, expiry_anchor_date, system_state, terminated_at
  INTO s
  FROM public.schools WHERE id = _school_id;

  IF s IS NULL THEN
    RETURN 'trial_active'::school_system_state;
  END IF;

  -- Terminated is sticky until renewal explicitly clears it
  IF s.terminated_at IS NOT NULL THEN
    RETURN 'terminated'::school_system_state;
  END IF;

  -- Active paid subscription = full access
  IF s.payment_verified = true AND s.subscription_status = 'active'
     AND (s.subscription_renewal_date IS NULL OR s.subscription_renewal_date >= CURRENT_DATE) THEN
    RETURN 'subscription_active'::school_system_state;
  END IF;

  -- Compute from anchor date (trial end or renewal date)
  stage := public.compute_lifecycle_stage(
    COALESCE(s.expiry_anchor_date, s.subscription_renewal_date, s.trial_end_date)
  );

  RETURN stage::school_system_state;
END;
$$;

-- Update is_school_restricted to treat all post-grace stages as restricted
CREATE OR REPLACE FUNCTION public.is_school_restricted(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_school_effective_state(_school_id) IN
    ('trial_expired'::school_system_state,
     'restricted_mode'::school_system_state,
     'warning_phase'::school_system_state,
     'suspended'::school_system_state,
     'terminated'::school_system_state);
$$;
