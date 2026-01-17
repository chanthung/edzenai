-- Create enum for rejection reasons
CREATE TYPE public.proof_rejection_reason AS ENUM (
  'amount_mismatch',
  'old_reused_screenshot',
  'payment_not_received',
  'wrong_month_selected',
  'screenshot_unclear',
  'incorrect_reference',
  'other'
);

-- Create enum for proof status
CREATE TYPE public.proof_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Create payment_proofs table
CREATE TABLE public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  installment_id uuid NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  reference_number text,
  status proof_status NOT NULL DEFAULT 'pending',
  
  -- Verification fields
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  bank_verified boolean DEFAULT false,
  admin_notes text,
  
  -- Rejection fields
  rejection_reason proof_rejection_reason,
  rejection_message text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraint: only one active (pending) proof per student-installment
  CONSTRAINT unique_pending_proof UNIQUE (student_id, installment_id) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_proofs

-- School admins can view all proofs for their school's students
CREATE POLICY "Admins can view payment proofs of their schools"
ON public.payment_proofs
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE school_id IN (SELECT get_user_school_ids())
  )
);

-- School admins can manage (update/delete) proofs for their school's students
CREATE POLICY "Admins can manage payment proofs of their schools"
ON public.payment_proofs
FOR ALL
USING (
  student_id IN (
    SELECT id FROM public.students 
    WHERE school_id IN (SELECT get_user_school_ids())
  )
);

-- Public can insert proofs (parents via access token - validated in app logic)
CREATE POLICY "Public can submit payment proofs"
ON public.payment_proofs
FOR INSERT
WITH CHECK (true);

-- Public can view proofs (parents via access token - filtered in app logic)
CREATE POLICY "Public can view payment proofs"
ON public.payment_proofs
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies for payment-proofs bucket

-- Anyone can upload to payment-proofs bucket (parent uploads via public form)
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Anyone can view payment proofs (access controlled via app logic with access token)
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Admins can delete payment proofs
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-proofs' 
  AND auth.uid() IN (
    SELECT user_id FROM public.school_admins
  )
);

-- Create index for faster queries
CREATE INDEX idx_payment_proofs_student ON public.payment_proofs(student_id);
CREATE INDEX idx_payment_proofs_installment ON public.payment_proofs(installment_id);
CREATE INDEX idx_payment_proofs_status ON public.payment_proofs(status);