-- Add admin block columns for suspicious-login lockout
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS access_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_blocked_reason text,
  ADD COLUMN IF NOT EXISTS access_blocked_by uuid;

-- Helper: check if a school is admin-blocked (publicly readable so login flow can check)
CREATE OR REPLACE FUNCTION public.is_school_access_blocked(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(access_blocked, false) FROM public.schools WHERE id = _school_id
$$;

-- Helper for current user: is any of their schools blocked?
CREATE OR REPLACE FUNCTION public.current_user_blocked_school()
RETURNS TABLE(school_id uuid, school_name text, reason text, blocked_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.name, s.access_blocked_reason, s.access_blocked_at
  FROM public.schools s
  WHERE s.access_blocked = true
    AND (
      s.id IN (SELECT school_id FROM public.school_admins WHERE user_id = auth.uid())
      OR s.id IN (SELECT school_id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active = true)
    )
  LIMIT 1
$$;