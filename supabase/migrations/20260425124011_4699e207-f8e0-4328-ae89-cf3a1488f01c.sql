
-- Replace broad SELECT with one that prevents enumeration via list APIs
DROP POLICY IF EXISTS "Public can view school logos" ON storage.objects;

-- Allow service role and admins to list; public access still works via direct URL on public buckets
CREATE POLICY "School admins can list their school logos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND public.is_school_admin(((storage.foldername(name))[1])::uuid)
);
