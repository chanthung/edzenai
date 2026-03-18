
-- Step 1: Create junction table
CREATE TABLE public.subject_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, class_name)
);

ALTER TABLE public.subject_class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subject class assignments" ON public.subject_class_assignments FOR ALL
  TO authenticated USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers can manage subject class assignments" ON public.subject_class_assignments FOR ALL
  TO public USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE POLICY "Public can view subject class assignments" ON public.subject_class_assignments FOR SELECT
  TO public USING (true);

-- Step 2: Migrate existing class_name data into junction table
INSERT INTO public.subject_class_assignments (subject_id, school_id, class_name)
SELECT id, school_id, class_name FROM public.subjects
WHERE class_name IS NOT NULL
ON CONFLICT (subject_id, class_name) DO NOTHING;

-- Step 3: Deduplicate subjects
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    WITH ranked AS (
      SELECT id, school_id, lower(name) as lname, subject_type,
        ROW_NUMBER() OVER (PARTITION BY school_id, lower(name), subject_type ORDER BY created_at) as rn
      FROM subjects
    ),
    to_merge AS (
      SELECT r.id as old_id, m.id as master_id
      FROM ranked r
      JOIN ranked m ON r.school_id = m.school_id AND r.lname = m.lname AND r.subject_type = m.subject_type AND m.rn = 1
      WHERE r.rn > 1
    )
    SELECT old_id, master_id FROM to_merge
  LOOP
    -- Delete conflicting student_marks before remapping (keep master's marks if both exist)
    DELETE FROM student_marks
    WHERE subject_id = rec.old_id
      AND (student_id, assessment_id) IN (
        SELECT student_id, assessment_id FROM student_marks WHERE subject_id = rec.master_id
      );
    -- Remap remaining student_marks
    UPDATE student_marks SET subject_id = rec.master_id WHERE subject_id = rec.old_id;
    -- Delete conflicting competencies before remapping
    DELETE FROM student_competency_scores WHERE competency_id IN (
      SELECT id FROM competencies WHERE subject_id = rec.old_id
        AND name IN (SELECT name FROM competencies WHERE subject_id = rec.master_id)
    );
    -- Remap competencies (delete dupes by name first)
    DELETE FROM competencies
    WHERE subject_id = rec.old_id
      AND lower(name) IN (SELECT lower(name) FROM competencies WHERE subject_id = rec.master_id);
    UPDATE competencies SET subject_id = rec.master_id WHERE subject_id = rec.old_id;
    -- Move class assignments to master
    INSERT INTO subject_class_assignments (subject_id, school_id, class_name)
    SELECT rec.master_id, sca.school_id, sca.class_name
    FROM subject_class_assignments sca WHERE sca.subject_id = rec.old_id
    ON CONFLICT (subject_id, class_name) DO NOTHING;
    -- Delete old assignments
    DELETE FROM subject_class_assignments WHERE subject_id = rec.old_id;
    -- Delete duplicate subject
    DELETE FROM subjects WHERE id = rec.old_id;
  END LOOP;
END $$;

-- Step 4: Drop class_name column from subjects
ALTER TABLE public.subjects DROP COLUMN class_name;
