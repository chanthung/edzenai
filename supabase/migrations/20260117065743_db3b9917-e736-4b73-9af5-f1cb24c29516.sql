-- Create storage bucket for school QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-qr-codes', 'school-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow school admins to upload QR codes for their school
CREATE POLICY "School admins can upload QR codes"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'school-qr-codes' 
  AND (storage.foldername(name))[1] IN (SELECT get_user_school_ids()::text)
);

-- Allow school admins to update their QR codes
CREATE POLICY "School admins can update QR codes"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'school-qr-codes' 
  AND (storage.foldername(name))[1] IN (SELECT get_user_school_ids()::text)
);

-- Allow school admins to delete their QR codes
CREATE POLICY "School admins can delete QR codes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'school-qr-codes' 
  AND (storage.foldername(name))[1] IN (SELECT get_user_school_ids()::text)
);

-- Allow public access to view QR codes (for parents)
CREATE POLICY "Public can view QR codes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'school-qr-codes');