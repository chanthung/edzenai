-- Fix: anon parents could not insert payment_proofs because the policy's EXISTS
-- subquery joins students (which has no anon SELECT policy).
-- Replace the INSERT policy with one that uses a SECURITY DEFINER function
-- to bypass RLS on the joined tables.

CREATE OR REPLACE FUNCTION public.validate_payment_proof_insert(_student_id uuid, _installment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.installments i ON i.id = _installment_id
    JOIN public.fee_structures fs ON fs.id = i.fee_structure_id
    WHERE s.id = _student_id
      AND fs.school_id = s.school_id
  );
$$;

DROP POLICY IF EXISTS "Public can submit payment proofs" ON public.payment_proofs;

CREATE POLICY "Public can submit payment proofs"
ON public.payment_proofs
FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.validate_payment_proof_insert(student_id, installment_id)
  AND status = 'pending'::proof_status
  AND verified_at IS NULL
  AND verified_by IS NULL
);