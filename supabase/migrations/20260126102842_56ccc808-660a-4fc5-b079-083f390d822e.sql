-- Create enum for school system states
CREATE TYPE public.school_system_state AS ENUM (
  'trial_active',
  'trial_expired',
  'subscription_active',
  'restricted_mode'
);

-- Add trial and payment verification columns to schools table
ALTER TABLE public.schools
ADD COLUMN trial_start_date date,
ADD COLUMN trial_end_date date,
ADD COLUMN system_state public.school_system_state DEFAULT 'trial_active',
ADD COLUMN payment_verified boolean DEFAULT false,
ADD COLUMN payment_verified_at timestamp with time zone,
ADD COLUMN payment_verified_by uuid;

-- Create function to calculate effective school state
CREATE OR REPLACE FUNCTION public.get_school_effective_state(_school_id uuid)
RETURNS public.school_system_state
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE
      -- If payment verified and subscription active, it's subscription_active
      WHEN s.payment_verified = true AND s.subscription_status = 'active' THEN 'subscription_active'::school_system_state
      -- If no trial end date set or still within trial period
      WHEN s.trial_end_date IS NULL OR CURRENT_DATE <= s.trial_end_date THEN 'trial_active'::school_system_state
      -- Trial has expired
      ELSE 'trial_expired'::school_system_state
    END
  FROM public.schools s
  WHERE s.id = _school_id
$$;

-- Create function to check if school is in restricted mode
CREATE OR REPLACE FUNCTION public.is_school_restricted(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE
      WHEN public.get_school_effective_state(_school_id) IN ('trial_expired', 'restricted_mode') THEN true
      ELSE false
    END
$$;