
-- 1. Create normalization function
CREATE OR REPLACE FUNCTION public.normalize_class_name(raw_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN raw_name IS NULL THEN NULL
    WHEN trim(raw_name) ~ '^\d+$' THEN 'Class ' || trim(raw_name)
    ELSE trim(raw_name)
  END;
$$;

-- 2. Delete bare-number duplicates from fee_structure_classes where normalized version already exists
DELETE FROM fee_structure_classes fsc1
WHERE trim(fsc1.class_name) ~ '^\d+$'
  AND EXISTS (
    SELECT 1 FROM fee_structure_classes fsc2
    WHERE fsc2.fee_structure_id = fsc1.fee_structure_id
      AND fsc2.class_name = 'Class ' || trim(fsc1.class_name)
  );

-- 3. Fix existing data in all tables
UPDATE students SET class_name = normalize_class_name(class_name)
WHERE class_name IS NOT NULL AND trim(class_name) ~ '^\d+$';

UPDATE student_enrollments SET class_name = normalize_class_name(class_name)
WHERE class_name IS NOT NULL AND trim(class_name) ~ '^\d+$';

UPDATE subject_class_assignments SET class_name = normalize_class_name(class_name)
WHERE trim(class_name) ~ '^\d+$';

UPDATE teacher_class_assignments SET class_name = normalize_class_name(class_name)
WHERE trim(class_name) ~ '^\d+$';

UPDATE fee_structure_classes SET class_name = normalize_class_name(class_name)
WHERE trim(class_name) ~ '^\d+$';

UPDATE class_template_assignments SET class_name = normalize_class_name(class_name)
WHERE trim(class_name) ~ '^\d+$';

UPDATE assessments SET class_name = normalize_class_name(class_name)
WHERE class_name IS NOT NULL AND trim(class_name) ~ '^\d+$';

-- 4. Create trigger function
CREATE OR REPLACE FUNCTION public.trigger_normalize_class_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.class_name := normalize_class_name(NEW.class_name);
  RETURN NEW;
END;
$$;

-- 5. Attach triggers
CREATE TRIGGER trg_normalize_class_name_students
  BEFORE INSERT OR UPDATE OF class_name ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_student_enrollments
  BEFORE INSERT OR UPDATE OF class_name ON student_enrollments
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_subject_class_assignments
  BEFORE INSERT OR UPDATE OF class_name ON subject_class_assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_teacher_class_assignments
  BEFORE INSERT OR UPDATE OF class_name ON teacher_class_assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_fee_structure_classes
  BEFORE INSERT OR UPDATE OF class_name ON fee_structure_classes
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_class_template_assignments
  BEFORE INSERT OR UPDATE OF class_name ON class_template_assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();

CREATE TRIGGER trg_normalize_class_name_assessments
  BEFORE INSERT OR UPDATE OF class_name ON assessments
  FOR EACH ROW EXECUTE FUNCTION trigger_normalize_class_name();
