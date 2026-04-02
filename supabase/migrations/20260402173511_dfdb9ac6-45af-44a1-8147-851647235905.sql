
CREATE TABLE public.teacher_subject_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.school_teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

ALTER TABLE public.teacher_subject_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage teacher subject assignments"
ON public.teacher_subject_assignments
FOR ALL TO authenticated
USING (school_id IN (SELECT get_user_school_ids()))
WITH CHECK (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers can view their own subject assignments"
ON public.teacher_subject_assignments
FOR SELECT TO public
USING (teacher_id IN (SELECT id FROM school_teachers WHERE user_id = auth.uid()));
