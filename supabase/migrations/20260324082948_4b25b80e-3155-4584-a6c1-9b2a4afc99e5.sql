
CREATE OR REPLACE FUNCTION public.auto_assign_fees_for_class(
  _fee_structure_id uuid,
  _class_name text,
  _academic_year_id uuid,
  _new_admission_only boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  WITH inserted AS (
    INSERT INTO student_fees (student_id, fee_structure_id)
    SELECT s.id, _fee_structure_id
    FROM students s
    JOIN fee_structures fs ON fs.id = _fee_structure_id
    WHERE s.class_name = _class_name
      AND s.school_id = (SELECT school_id FROM fee_structures WHERE id = _fee_structure_id)
      AND fs.academic_year_id = _academic_year_id
      -- If new_admission_only, skip students with prior-year enrollments
      AND NOT (
        _new_admission_only = true
        AND EXISTS (
          SELECT 1 FROM student_enrollments se
          JOIN academic_years ay ON ay.id = se.academic_year_id
          WHERE se.student_id = s.id
            AND ay.id != _academic_year_id
        )
      )
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO _count FROM inserted;
  
  RETURN _count;
END;
$$;
