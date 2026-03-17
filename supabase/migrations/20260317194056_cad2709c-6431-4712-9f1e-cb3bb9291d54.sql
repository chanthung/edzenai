
-- Enum for grading type
CREATE TYPE public.grading_type AS ENUM ('percentage', 'custom_grades');

-- Assessment Templates
CREATE TABLE public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  grading_type grading_type NOT NULL DEFAULT 'percentage',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assessment templates" ON public.assessment_templates FOR ALL TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Admins can view assessment templates" ON public.assessment_templates FOR SELECT TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Teachers can view assessment templates" ON public.assessment_templates FOR SELECT TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

-- Template Terms
CREATE TABLE public.template_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template terms" ON public.template_terms FOR ALL TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Admins can view template terms" ON public.template_terms FOR SELECT TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Teachers can view template terms" ON public.template_terms FOR SELECT TO public
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_teacher_school_ids())));

-- Template Components
CREATE TABLE public.template_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  max_marks numeric NOT NULL DEFAULT 100,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template components" ON public.template_components FOR ALL TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Admins can view template components" ON public.template_components FOR SELECT TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Teachers can view template components" ON public.template_components FOR SELECT TO public
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_teacher_school_ids())));

-- Template Grade Mappings
CREATE TABLE public.template_grade_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  min_percentage numeric NOT NULL,
  max_percentage numeric NOT NULL,
  grade_label text NOT NULL,
  numerical_grade numeric,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_grade_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage grade mappings" ON public.template_grade_mappings FOR ALL TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Admins can view grade mappings" ON public.template_grade_mappings FOR SELECT TO authenticated
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_user_school_ids())));
CREATE POLICY "Teachers can view grade mappings" ON public.template_grade_mappings FOR SELECT TO public
  USING (template_id IN (SELECT id FROM public.assessment_templates WHERE school_id IN (SELECT get_teacher_school_ids())));

-- Class Template Assignments
CREATE TABLE public.class_template_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, class_name, academic_year_id)
);
ALTER TABLE public.class_template_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class template assignments" ON public.class_template_assignments FOR ALL TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Admins can view class template assignments" ON public.class_template_assignments FOR SELECT TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Teachers can view class template assignments" ON public.class_template_assignments FOR SELECT TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

-- Component Marks (extends student_marks)
CREATE TABLE public.component_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_mark_id uuid NOT NULL REFERENCES public.student_marks(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES public.template_components(id) ON DELETE CASCADE,
  marks_obtained numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_mark_id, component_id)
);
ALTER TABLE public.component_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage component marks" ON public.component_marks FOR ALL TO authenticated
  USING (student_mark_id IN (SELECT id FROM public.student_marks WHERE student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT get_user_school_ids()))));
CREATE POLICY "Admins can view component marks" ON public.component_marks FOR SELECT TO authenticated
  USING (student_mark_id IN (SELECT id FROM public.student_marks WHERE student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT get_user_school_ids()))));
CREATE POLICY "Teachers can manage component marks" ON public.component_marks FOR ALL TO public
  USING (student_mark_id IN (SELECT id FROM public.student_marks WHERE student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT get_teacher_school_ids()))));
CREATE POLICY "Teachers can view component marks" ON public.component_marks FOR SELECT TO public
  USING (student_mark_id IN (SELECT id FROM public.student_marks WHERE student_id IN (SELECT id FROM public.students WHERE school_id IN (SELECT get_teacher_school_ids()))));
CREATE POLICY "Public can view component marks" ON public.component_marks FOR SELECT TO public
  USING (true);

-- Updated_at triggers
CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
