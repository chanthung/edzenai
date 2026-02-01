-- Add 'teacher' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- Create a table to link teachers to schools
CREATE TABLE public.school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- Enable RLS on school_teachers
ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is a teacher for a school
CREATE OR REPLACE FUNCTION public.is_school_teacher(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_teachers
    WHERE user_id = auth.uid() 
      AND school_id = _school_id
      AND is_active = true
  )
$$;

-- Create a function to get teacher's school IDs
CREATE OR REPLACE FUNCTION public.get_teacher_school_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.school_teachers 
  WHERE user_id = auth.uid() AND is_active = true
$$;

-- RLS policies for school_teachers table
CREATE POLICY "School admins can view teachers of their schools"
ON public.school_teachers FOR SELECT
USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "School admins can manage teachers of their schools"
ON public.school_teachers FOR ALL
USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers can view their own records"
ON public.school_teachers FOR SELECT
USING (user_id = auth.uid());

-- Update subjects RLS to allow teachers
CREATE POLICY "Teachers can view subjects of their schools"
ON public.subjects FOR SELECT
USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Teachers can manage subjects of their schools"
ON public.subjects FOR ALL
USING (school_id IN (SELECT get_teacher_school_ids()));

-- Update assessments RLS to allow teachers
CREATE POLICY "Teachers can view assessments of their schools"
ON public.assessments FOR SELECT
USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Teachers can manage assessments of their schools"
ON public.assessments FOR ALL
USING (school_id IN (SELECT get_teacher_school_ids()));

-- Update student_marks RLS to allow teachers
CREATE POLICY "Teachers can view marks of their school students"
ON public.student_marks FOR SELECT
USING (student_id IN (
  SELECT s.id FROM public.students s
  WHERE s.school_id IN (SELECT get_teacher_school_ids())
));

CREATE POLICY "Teachers can manage marks of their school students"
ON public.student_marks FOR ALL
USING (student_id IN (
  SELECT s.id FROM public.students s
  WHERE s.school_id IN (SELECT get_teacher_school_ids())
));

-- Allow teachers to view students (read-only for progress tracking)
CREATE POLICY "Teachers can view students of their schools"
ON public.students FOR SELECT
USING (school_id IN (SELECT get_teacher_school_ids()));

-- Allow teachers to view academic years
CREATE POLICY "Teachers can view academic years of their schools"
ON public.academic_years FOR SELECT
USING (school_id IN (SELECT get_teacher_school_ids()));

-- Add trigger for updated_at
CREATE TRIGGER update_school_teachers_updated_at
BEFORE UPDATE ON public.school_teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();