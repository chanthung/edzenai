
-- Add class_name column
ALTER TABLE public.teacher_subject_assignments 
ADD COLUMN class_name text;

-- Backfill: for each existing assignment, create rows for each class the subject is assigned to
INSERT INTO public.teacher_subject_assignments (teacher_id, subject_id, school_id, class_name)
SELECT tsa.teacher_id, tsa.subject_id, tsa.school_id, sca.class_name
FROM public.teacher_subject_assignments tsa
JOIN public.subject_class_assignments sca 
  ON sca.subject_id = tsa.subject_id AND sca.school_id = tsa.school_id
WHERE tsa.class_name IS NULL
ON CONFLICT DO NOTHING;

-- Remove old rows without class_name (they've been expanded)
DELETE FROM public.teacher_subject_assignments WHERE class_name IS NULL;

-- Make class_name NOT NULL now that all rows have it
ALTER TABLE public.teacher_subject_assignments 
ALTER COLUMN class_name SET NOT NULL;

-- Drop old unique constraint and add new one
ALTER TABLE public.teacher_subject_assignments 
DROP CONSTRAINT IF EXISTS teacher_subject_assignments_teacher_id_subject_id_key;

ALTER TABLE public.teacher_subject_assignments 
ADD CONSTRAINT teacher_subject_assignments_teacher_subject_class_key 
UNIQUE (teacher_id, subject_id, class_name);
