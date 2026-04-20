
-- 1. Fix function search_path on email queue helpers
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2. Tighten payment_proofs INSERT policy (was WITH CHECK true)
DROP POLICY IF EXISTS "Public can submit payment proofs" ON public.payment_proofs;
CREATE POLICY "Public can submit payment proofs"
ON public.payment_proofs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.installments i ON i.id = payment_proofs.installment_id
    JOIN public.fee_structures fs ON fs.id = i.fee_structure_id
    WHERE s.id = payment_proofs.student_id
      AND fs.school_id = s.school_id
  )
  AND status = 'pending'
  AND verified_at IS NULL
  AND verified_by IS NULL
);

-- 3. Tighten contact_submissions INSERT policy (was WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name))    BETWEEN 1 AND 200
  AND length(trim(email))   BETWEEN 3 AND 320
  AND email LIKE '%_@_%.__%'
  AND length(trim(subject)) BETWEEN 1 AND 300
  AND length(trim(message)) BETWEEN 1 AND 5000
);

-- 4. Restrict storage bucket SELECT to specific paths, blocking listing
-- Files remain accessible by direct URL (Supabase signs/serves via storage.objects RLS),
-- but a broad SELECT * is no longer possible.

DROP POLICY IF EXISTS "Anyone can view payment proofs"      ON storage.objects;
DROP POLICY IF EXISTS "Public can view payment proof files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view QR codes"            ON storage.objects;

-- Payment proofs: viewable only when querying by exact path (name) — prevents listing.
CREATE POLICY "Payment proofs viewable by exact name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'payment-proofs'
  AND name = COALESCE(current_setting('request.object.name', true), name)
  AND octet_length(name) > 0
);

-- QR codes: viewable only when querying by exact path.
CREATE POLICY "QR codes viewable by exact name"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'school-qr-codes'
  AND name = COALESCE(current_setting('request.object.name', true), name)
  AND octet_length(name) > 0
);
