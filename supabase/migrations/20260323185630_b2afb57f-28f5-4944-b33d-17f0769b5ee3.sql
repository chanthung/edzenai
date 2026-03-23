
-- 1. Add category_group to fee_categories
ALTER TABLE public.fee_categories ADD COLUMN category_group text;

-- 2. Add new_admission_only to fee_structure_classes
ALTER TABLE public.fee_structure_classes ADD COLUMN new_admission_only boolean NOT NULL DEFAULT false;

-- 3. Update the auto_assign_fees_for_student RPC to respect new_admission_only
CREATE OR REPLACE FUNCTION public.auto_assign_fees_for_student(_student_id uuid, _academic_year_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_existing_student boolean;
BEGIN
  -- Check if student has enrollments in any PREVIOUS academic year
  SELECT EXISTS (
    SELECT 1
    FROM student_enrollments se
    JOIN academic_years ay ON ay.id = se.academic_year_id
    WHERE se.student_id = _student_id
      AND ay.id != _academic_year_id
  ) INTO _is_existing_student;

  INSERT INTO student_fees (student_id, fee_structure_id)
  SELECT _student_id, fs.id
  FROM fee_structures fs
  JOIN fee_structure_classes fsc ON fsc.fee_structure_id = fs.id AND fsc.auto_assign = true
  JOIN students s ON s.id = _student_id AND s.class_name = fsc.class_name
  WHERE fs.academic_year_id = _academic_year_id
    -- Skip new_admission_only fees for existing students
    AND NOT (fsc.new_admission_only = true AND _is_existing_student = true)
  ON CONFLICT DO NOTHING;
END;
$function$;
