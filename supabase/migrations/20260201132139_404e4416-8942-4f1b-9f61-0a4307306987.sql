-- Function to get student marks by access token (secure, no direct table access)
CREATE OR REPLACE FUNCTION public.get_student_marks_by_access_token(_access_token uuid)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  marks_obtained numeric,
  max_marks numeric,
  remarks text,
  assessment_id uuid,
  assessment_name text,
  assessment_type text,
  assessment_date date,
  subject_id uuid,
  subject_name text,
  subject_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.student_id,
    sm.marks_obtained,
    sm.max_marks,
    sm.remarks,
    a.id as assessment_id,
    a.name as assessment_name,
    a.assessment_type,
    a.assessment_date,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code
  FROM student_marks sm
  INNER JOIN students st ON st.id = sm.student_id
  INNER JOIN assessments a ON a.id = sm.assessment_id
  INNER JOIN subjects s ON s.id = sm.subject_id
  WHERE st.access_token = _access_token
  ORDER BY a.assessment_date DESC NULLS LAST, s.display_order ASC;
END;
$$;