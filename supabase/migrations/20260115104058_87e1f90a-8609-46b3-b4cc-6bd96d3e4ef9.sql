-- Fix the remaining permissive policy - schools INSERT
-- Only authenticated users can create schools, and they must set themselves as admin after
DROP POLICY IF EXISTS "Authenticated users can create schools" ON public.schools;

CREATE POLICY "Authenticated users can create schools"
ON public.schools FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);