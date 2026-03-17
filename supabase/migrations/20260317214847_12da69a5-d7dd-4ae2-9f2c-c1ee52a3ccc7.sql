
-- Create mastery_level enum
CREATE TYPE public.mastery_level AS ENUM ('beginning', 'developing', 'proficient', 'advanced');

-- Create competencies table
CREATE TABLE public.competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create student_competency_scores table
CREATE TABLE public.student_competency_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  mastery_level public.mastery_level NOT NULL DEFAULT 'beginning',
  score numeric,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, competency_id, assessment_id)
);

-- Enable RLS
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_competency_scores ENABLE ROW LEVEL SECURITY;

-- RLS for competencies
CREATE POLICY "Admins can manage competencies" ON public.competencies
  FOR ALL TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Admins can view competencies" ON public.competencies
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers can manage competencies" ON public.competencies
  FOR ALL TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Teachers can view competencies" ON public.competencies
  FOR SELECT TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Public can view competencies" ON public.competencies
  FOR SELECT TO public
  USING (true);

-- RLS for student_competency_scores
CREATE POLICY "Admins can manage competency scores" ON public.student_competency_scores
  FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.school_id IN (SELECT get_user_school_ids())));

CREATE POLICY "Admins can view competency scores" ON public.student_competency_scores
  FOR SELECT TO authenticated
  USING (student_id IN (SELECT s.id FROM students s WHERE s.school_id IN (SELECT get_user_school_ids())));

CREATE POLICY "Teachers can manage competency scores" ON public.student_competency_scores
  FOR ALL TO public
  USING (student_id IN (SELECT s.id FROM students s WHERE s.school_id IN (SELECT get_teacher_school_ids())));

CREATE POLICY "Teachers can view competency scores" ON public.student_competency_scores
  FOR SELECT TO public
  USING (student_id IN (SELECT s.id FROM students s WHERE s.school_id IN (SELECT get_teacher_school_ids())));

CREATE POLICY "Public can view competency scores" ON public.student_competency_scores
  FOR SELECT TO public
  USING (true);
