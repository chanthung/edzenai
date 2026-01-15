-- Allow public/anonymous users to view school info (needed for parent view)
CREATE POLICY "Public can view school info"
ON public.schools FOR SELECT
TO anon
USING (true);