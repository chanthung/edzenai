
-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date date NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  marked_by uuid,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create indexes
CREATE INDEX idx_attendance_school_date ON public.attendance(school_id, date);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage attendance for their school
CREATE POLICY "Admins can manage attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Admins can view attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

-- RLS: Teachers can manage attendance for their school
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Teachers can view attendance"
  ON public.attendance FOR SELECT
  TO public
  USING (school_id IN (SELECT get_teacher_school_ids()));

-- RLS: Public can view attendance (for parent access token flow)
CREATE POLICY "Public can view attendance"
  ON public.attendance FOR SELECT
  TO public
  USING (true);

-- Security definer function for parent view
CREATE OR REPLACE FUNCTION public.get_student_attendance_by_access_token(_access_token uuid)
RETURNS TABLE(
  date date,
  status public.attendance_status,
  remarks text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.date, a.status, a.remarks
  FROM attendance a
  INNER JOIN students st ON st.id = a.student_id
  WHERE st.access_token = _access_token
  ORDER BY a.date DESC;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
