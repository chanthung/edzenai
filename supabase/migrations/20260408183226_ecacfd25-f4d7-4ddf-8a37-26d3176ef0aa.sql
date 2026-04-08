
-- 1. Add 'accountant' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';

-- 2. Add role column to school_teachers table
ALTER TABLE public.school_teachers 
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'teacher';

-- 3. Create a helper function to check if user is an accountant at a school
CREATE OR REPLACE FUNCTION public.get_accountant_school_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.school_teachers 
  WHERE user_id = auth.uid() AND is_active = true AND role = 'accountant'
$$;

-- 4. RLS: Accountants can view students of their schools (read-only)
CREATE POLICY "Accountants can view students of their schools"
ON public.students
FOR SELECT
USING (school_id IN (SELECT get_accountant_school_ids()));

-- 5. RLS: Accountants can view fee categories
CREATE POLICY "Accountants can view fee categories"
ON public.fee_categories
FOR SELECT
TO authenticated
USING (school_id IN (SELECT get_accountant_school_ids()));

-- 6. RLS: Accountants can manage fee structures
CREATE POLICY "Accountants can manage fee structures"
ON public.fee_structures
FOR ALL
TO authenticated
USING (school_id IN (SELECT get_accountant_school_ids()));

-- 7. RLS: Accountants can manage installments
CREATE POLICY "Accountants can manage installments"
ON public.installments
FOR ALL
TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));

-- 8. RLS: Accountants can manage payments
CREATE POLICY "Accountants can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (student_id IN (
  SELECT id FROM students 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));

-- 9. RLS: Accountants can manage student fees
CREATE POLICY "Accountants can manage student fees"
ON public.student_fees
FOR ALL
TO authenticated
USING (student_id IN (
  SELECT id FROM students 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));

-- 10. RLS: Accountants can view payment proofs
CREATE POLICY "Accountants can view payment proofs"
ON public.payment_proofs
FOR ALL
TO authenticated
USING (student_id IN (
  SELECT id FROM students 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));

-- 11. RLS: Accountants can view fee structure classes
CREATE POLICY "Accountants can view fee structure classes"
ON public.fee_structure_classes
FOR ALL
TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));

-- 12. RLS: Accountants can view academic years (needed for fee context)
CREATE POLICY "Accountants can view academic years"
ON public.academic_years
FOR SELECT
TO authenticated
USING (school_id IN (SELECT get_accountant_school_ids()));

-- 13. RLS: Accountants can view fee reminder logs
CREATE POLICY "Accountants can view fee reminder logs"
ON public.fee_reminder_logs
FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT id FROM students 
  WHERE school_id IN (SELECT get_accountant_school_ids())
));
