
-- 1. New junction table: fee_structure_classes
CREATE TABLE public.fee_structure_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  auto_assign boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fee_structure_id, class_name)
);

ALTER TABLE public.fee_structure_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fee structure classes"
ON public.fee_structure_classes FOR ALL TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures WHERE school_id IN (SELECT get_user_school_ids())
));

CREATE POLICY "Admins can view fee structure classes"
ON public.fee_structure_classes FOR SELECT TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures WHERE school_id IN (SELECT get_user_school_ids())
));

-- 2. Unique constraint on student_fees to support ON CONFLICT DO NOTHING
ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_student_structure_unique 
  UNIQUE (student_id, fee_structure_id);

-- 3. Auto-assign function
CREATE OR REPLACE FUNCTION public.auto_assign_fees_for_student(
  _student_id uuid, _academic_year_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO student_fees (student_id, fee_structure_id)
  SELECT _student_id, fs.id
  FROM fee_structures fs
  JOIN fee_structure_classes fsc ON fsc.fee_structure_id = fs.id AND fsc.auto_assign = true
  JOIN students s ON s.id = _student_id AND s.class_name = fsc.class_name
  WHERE fs.academic_year_id = _academic_year_id
  ON CONFLICT DO NOTHING;
END;
$$;
