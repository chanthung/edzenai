-- Add explicit INSERT policy for academic_years
CREATE POLICY "Admins can insert academic years for their schools"
ON public.academic_years
FOR INSERT
TO authenticated
WITH CHECK (school_id IN (SELECT get_user_school_ids()));