-- Fix the overly permissive school_admins INSERT policy
-- Users should only be able to add themselves as admin when creating a new school
DROP POLICY IF EXISTS "Admins can manage school admins of their schools" ON public.school_admins;

CREATE POLICY "Existing admins can add new admins to their schools"
ON public.school_admins FOR INSERT
TO authenticated
WITH CHECK (
  school_id IN (SELECT public.get_user_school_ids()) 
  OR 
  (user_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.school_admins WHERE school_id = school_admins.school_id))
);