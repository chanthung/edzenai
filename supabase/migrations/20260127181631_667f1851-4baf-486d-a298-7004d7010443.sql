-- Make the payment-proofs bucket public so images can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'payment-proofs';

-- Add RLS policy to allow public read access to payment proofs
CREATE POLICY "Public can view payment proof files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs');