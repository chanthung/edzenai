
-- Create public bucket for school logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view school logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'school-logos');

-- School admins can upload to their school folder (folder = school_id)
CREATE POLICY "School admins can upload their school logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-logos'
  AND public.is_school_admin(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "School admins can update their school logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND public.is_school_admin(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "School admins can delete their school logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND public.is_school_admin(((storage.foldername(name))[1])::uuid)
);
