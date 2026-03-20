
-- Add subscription_plan column to schools
ALTER TABLE public.schools ADD COLUMN subscription_plan text NOT NULL DEFAULT 'starter';

-- Create AI usage log table for tracking Starter plan limits
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  feature text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS: School admins can view their own usage logs
CREATE POLICY "Admins can view their AI usage logs"
  ON public.ai_usage_log
  FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

-- RLS: School admins can insert usage logs
CREATE POLICY "Admins can insert AI usage logs"
  ON public.ai_usage_log
  FOR INSERT
  TO authenticated
  WITH CHECK (school_id IN (SELECT get_user_school_ids()));

-- RLS: Platform admins can view all usage logs
CREATE POLICY "Platform admins can view all AI usage logs"
  ON public.ai_usage_log
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- RLS: Teachers can view their school's usage logs
CREATE POLICY "Teachers can view AI usage logs"
  ON public.ai_usage_log
  FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT get_teacher_school_ids()));

-- RLS: Teachers can insert usage logs
CREATE POLICY "Teachers can insert AI usage logs"
  ON public.ai_usage_log
  FOR INSERT
  TO authenticated
  WITH CHECK (school_id IN (SELECT get_teacher_school_ids()));
