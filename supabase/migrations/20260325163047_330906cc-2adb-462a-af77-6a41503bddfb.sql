CREATE TABLE IF NOT EXISTS public.parent_link_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.parent_link_dispatches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_parent_link_dispatches_student_created_at
  ON public.parent_link_dispatches (student_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_parent_link_dispatch(
  _student_id UUID,
  _school_id UUID,
  _initiated_by UUID,
  _window_seconds INTEGER DEFAULT 120
)
RETURNS TABLE(dispatch_id UUID, is_duplicate BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_dispatch_id UUID;
  new_dispatch_id UUID;
BEGIN
  SELECT id
  INTO existing_dispatch_id
  FROM public.parent_link_dispatches
  WHERE student_id = _student_id
    AND created_at >= now() - make_interval(secs => _window_seconds)
    AND status IN ('pending', 'sent')
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_dispatch_id IS NOT NULL THEN
    RETURN QUERY SELECT existing_dispatch_id, true;
    RETURN;
  END IF;

  INSERT INTO public.parent_link_dispatches (
    student_id,
    school_id,
    initiated_by,
    status
  ) VALUES (
    _student_id,
    _school_id,
    _initiated_by,
    'pending'
  )
  RETURNING id INTO new_dispatch_id;

  RETURN QUERY SELECT new_dispatch_id, false;
END;
$$;