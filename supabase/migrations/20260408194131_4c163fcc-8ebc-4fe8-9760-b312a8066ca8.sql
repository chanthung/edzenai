-- Allow accountants to view their school record
CREATE POLICY "Accountants can view their school"
ON public.schools
FOR SELECT
TO authenticated
USING (id IN (SELECT get_accountant_school_ids() AS get_accountant_school_ids));

-- Allow accountants to view students (UPDATE for edit capability)
CREATE POLICY "Accountants can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (school_id IN (SELECT get_accountant_school_ids() AS get_accountant_school_ids));

-- Allow accountants to view parent link dispatches
CREATE POLICY "Accountants can view parent link dispatches"
ON public.parent_link_dispatches
FOR SELECT
TO authenticated
USING (school_id IN (SELECT get_accountant_school_ids() AS get_accountant_school_ids));