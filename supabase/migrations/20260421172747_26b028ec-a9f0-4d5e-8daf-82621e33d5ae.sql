-- Add OCR-related columns to payment_proofs
ALTER TABLE public.payment_proofs
  ADD COLUMN IF NOT EXISTS amount_paid numeric,
  ADD COLUMN IF NOT EXISTS ocr_amount numeric,
  ADD COLUMN IF NOT EXISTS ocr_transaction_id text,
  ADD COLUMN IF NOT EXISTS ocr_date date,
  ADD COLUMN IF NOT EXISTS ocr_status text,
  ADD COLUMN IF NOT EXISTS ocr_confidence text,
  ADD COLUMN IF NOT EXISTS ocr_raw jsonb;

-- Partial unique index on reference_number per school (via student -> school)
-- Use a function-based approach: compute school_id via subquery is not possible in index expression directly,
-- so we use a cross-table approach by storing a generated key. Simplest: enforce uniqueness of (student.school_id, reference_number)
-- via a trigger-checked unique constraint. We'll use a unique index on (reference_number) scoped via a helper column.

-- Simpler approach: unique index on lower(reference_number) per school using a trigger to populate a school_id_cache column.
-- To avoid schema bloat, use a unique partial index on (reference_number) with a check via trigger instead.

-- Add a school_id column on payment_proofs to support the unique index (denormalized for indexing only).
ALTER TABLE public.payment_proofs
  ADD COLUMN IF NOT EXISTS school_id uuid;

-- Backfill school_id from related student
UPDATE public.payment_proofs pp
SET school_id = s.school_id
FROM public.students s
WHERE pp.student_id = s.id AND pp.school_id IS NULL;

-- Trigger to keep school_id in sync on insert
CREATE OR REPLACE FUNCTION public.set_payment_proof_school_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT school_id INTO NEW.school_id FROM public.students WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_payment_proof_school_id ON public.payment_proofs;
CREATE TRIGGER trg_set_payment_proof_school_id
  BEFORE INSERT ON public.payment_proofs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_payment_proof_school_id();

-- Partial unique index: one (school_id, reference_number) per school, ignoring rejected rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_proofs_unique_utr_per_school
  ON public.payment_proofs (school_id, lower(reference_number))
  WHERE reference_number IS NOT NULL AND status <> 'rejected';

-- Enable realtime for payment_proofs
ALTER TABLE public.payment_proofs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_proofs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_proofs';
  END IF;
END$$;