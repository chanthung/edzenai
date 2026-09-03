ALTER TABLE public.school_teachers ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE public.user_invites ADD COLUMN IF NOT EXISTS employee_id text;

CREATE UNIQUE INDEX IF NOT EXISTS school_teachers_employee_id_unique
  ON public.school_teachers (school_id, lower(employee_id))
  WHERE employee_id IS NOT NULL AND btrim(employee_id) <> '';