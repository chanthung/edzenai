ALTER TABLE public.school_teachers
  ADD COLUMN IF NOT EXISTS date_of_joining date,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS qualification text,
  ADD COLUMN IF NOT EXISTS experience_years integer,
  ADD COLUMN IF NOT EXISTS employment_type text,
  ADD COLUMN IF NOT EXISTS employment_status text;

ALTER TABLE public.school_teachers
  ADD CONSTRAINT school_teachers_gender_chk CHECK (gender IS NULL OR gender IN ('male','female','other','prefer_not_to_say')),
  ADD CONSTRAINT school_teachers_experience_chk CHECK (experience_years IS NULL OR (experience_years >= 0 AND experience_years <= 70)),
  ADD CONSTRAINT school_teachers_employment_type_chk CHECK (employment_type IS NULL OR employment_type IN ('full_time','part_time','contractual','substitute')),
  ADD CONSTRAINT school_teachers_employment_status_chk CHECK (employment_status IS NULL OR employment_status IN ('active','inactive','on_leave','resigned')),
  ADD CONSTRAINT school_teachers_designation_len CHECK (designation IS NULL OR length(designation) <= 100),
  ADD CONSTRAINT school_teachers_department_len CHECK (department IS NULL OR length(department) <= 100),
  ADD CONSTRAINT school_teachers_qualification_len CHECK (qualification IS NULL OR length(qualification) <= 200);

COMMENT ON COLUMN public.school_teachers.employment_status IS 'HR employment status only. Independent of is_active (login/account access).';

CREATE OR REPLACE FUNCTION public.school_teachers_assign_employee_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_next integer;
BEGIN
  IF NEW.employee_id IS NOT NULL AND btrim(NEW.employee_id) <> '' THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('emp_id:' || NEW.school_id::text, 0));
  SELECT COALESCE(MAX((substring(employee_id from '^EMP-(\d+)$'))::integer), 0) + 1
    INTO v_next FROM public.school_teachers
   WHERE school_id = NEW.school_id AND employee_id ~ '^EMP-\d+$';
  LOOP
    NEW.employee_id := 'EMP-' || lpad(v_next::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.school_teachers
      WHERE school_id = NEW.school_id AND lower(employee_id) = lower(NEW.employee_id));
    v_next := v_next + 1;
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER school_teachers_assign_employee_id
BEFORE INSERT ON public.school_teachers
FOR EACH ROW EXECUTE FUNCTION public.school_teachers_assign_employee_id();

CREATE OR REPLACE FUNCTION public.school_teachers_lock_employee_id()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.employee_id IS NOT NULL AND NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    NEW.employee_id := OLD.employee_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER school_teachers_lock_employee_id
BEFORE UPDATE ON public.school_teachers
FOR EACH ROW EXECUTE FUNCTION public.school_teachers_lock_employee_id();

-- Backfill missing IDs (existing IDs preserved), ordered by creation date per school
WITH ranked AS (
  SELECT id, school_id, row_number() OVER (PARTITION BY school_id ORDER BY created_at, id) AS rn
  FROM public.school_teachers WHERE employee_id IS NULL
)
UPDATE public.school_teachers t
   SET employee_id = 'EMP-' || lpad(r.rn::text, 4, '0')
  FROM ranked r WHERE t.id = r.id
   AND NOT EXISTS (SELECT 1 FROM public.school_teachers x WHERE x.school_id = r.school_id AND x.employee_id ~ '^EMP-\d+$');