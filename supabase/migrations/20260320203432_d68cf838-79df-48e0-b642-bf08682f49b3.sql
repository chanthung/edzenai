-- Allow platform admins to view all students (needed for billing student counts)
CREATE POLICY "Platform admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (is_platform_admin());