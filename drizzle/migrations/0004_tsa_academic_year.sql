ALTER TABLE public.teacher_subject_assignments
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE RESTRICT;

-- Tenant guard: the year must belong to the same school
CREATE OR REPLACE FUNCTION public.tsa_year_school_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.academic_year_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.academic_years WHERE id = NEW.academic_year_id AND school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'academic_year_id does not belong to this school';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS tsa_year_school_check ON public.teacher_subject_assignments;
CREATE TRIGGER tsa_year_school_check BEFORE INSERT OR UPDATE ON public.teacher_subject_assignments
  FOR EACH ROW EXECUTE FUNCTION public.tsa_year_school_check();

-- Backfill only schools with exactly one active academic year
UPDATE public.teacher_subject_assignments t
SET academic_year_id = y.id
FROM public.academic_years y
WHERE t.academic_year_id IS NULL
  AND y.school_id = t.school_id AND y.is_active
  AND (SELECT count(*) FROM public.academic_years y2 WHERE y2.school_id = t.school_id AND y2.is_active) = 1;

-- Uniqueness becomes year-scoped (yearless rows still unique among themselves)
CREATE UNIQUE INDEX IF NOT EXISTS tsa_teacher_subject_class_year_uidx
  ON public.teacher_subject_assignments (teacher_id, subject_id, class_name, academic_year_id) NULLS NOT DISTINCT;
ALTER TABLE public.teacher_subject_assignments DROP CONSTRAINT IF EXISTS teacher_subject_assignments_teacher_subject_class_key;

-- Query patterns: admin edit/teacher lists (school+year+teacher)
CREATE INDEX IF NOT EXISTS tsa_school_year_teacher_idx
  ON public.teacher_subject_assignments (school_id, academic_year_id, teacher_id);
-- teacher self-lookup by teacher + year
CREATE INDEX IF NOT EXISTS tsa_teacher_year_idx
  ON public.teacher_subject_assignments (teacher_id, academic_year_id);