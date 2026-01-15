-- Create a secure function to get student by access token
-- This bypasses RLS safely by only returning the specific student matching the token
CREATE OR REPLACE FUNCTION public.get_student_by_access_token(_access_token uuid)
RETURNS TABLE (
  id uuid,
  name text,
  class_name text,
  section text,
  roll_number text,
  school_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.name,
    s.class_name,
    s.section,
    s.roll_number,
    s.school_id
  FROM public.students s
  WHERE s.access_token = _access_token
  LIMIT 1
$$;

-- Grant execute permission to anon users
GRANT EXECUTE ON FUNCTION public.get_student_by_access_token(uuid) TO anon;

-- Drop the overly permissive policy that exposes all students to anonymous users
DROP POLICY IF EXISTS "Public can view student by access token" ON public.students;