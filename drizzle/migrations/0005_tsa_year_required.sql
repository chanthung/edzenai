ALTER TABLE public.teacher_subject_assignments ALTER COLUMN academic_year_id SET NOT NULL;
CREATE UNIQUE INDEX tsa_teacher_subject_school_class_year_uidx ON public.teacher_subject_assignments (teacher_id, subject_id, school_id, class_name, academic_year_id);
DROP INDEX IF EXISTS public.tsa_teacher_subject_class_year_uidx;