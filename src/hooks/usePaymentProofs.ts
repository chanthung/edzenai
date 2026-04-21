import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionStatus } from './useSubscriptionStatus';

// Types for payment proofs (since types.ts may not be updated yet)
export type ProofStatus = 'pending' | 'verified' | 'rejected';

export type ProofRejectionReason = 
  | 'amount_mismatch'
  | 'amount_mismatch_ocr'
  | 'old_reused_screenshot'
  | 'payment_not_received'
  | 'wrong_month_selected'
  | 'screenshot_unclear'
  | 'incorrect_reference'
  | 'other';

export const REJECTION_REASON_LABELS: Record<ProofRejectionReason, string> = {
  amount_mismatch: 'Amount does not match',
  amount_mismatch_ocr: 'Amount mismatch (OCR vs entered)',
  old_reused_screenshot: 'Old / reused screenshot',
  payment_not_received: 'Payment not received in bank',
  wrong_month_selected: 'Wrong month selected',
  screenshot_unclear: 'Screenshot unclear / incomplete',
  incorrect_reference: 'Incorrect reference number',
  other: 'Other',
};

export interface PaymentProof {
  id: string;
  student_id: string;
  installment_id: string;
  file_url: string;
  reference_number: string | null;
  status: ProofStatus;
  verified_by: string | null;
  verified_at: string | null;
  bank_verified: boolean;
  admin_notes: string | null;
  rejection_reason: ProofRejectionReason | null;
  rejection_message: string | null;
  amount_paid: number | null;
  ocr_amount: number | null;
  ocr_transaction_id: string | null;
  ocr_date: string | null;
  ocr_status: 'pending' | 'success' | 'failed' | null;
  ocr_confidence: 'high' | 'medium' | 'low' | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProofInsert {
  student_id: string;
  installment_id: string;
  file_url: string;
  reference_number?: string;
  amount_paid?: number | null;
  ocr_amount?: number | null;
  ocr_transaction_id?: string | null;
  ocr_date?: string | null;
  ocr_status?: 'pending' | 'success' | 'failed' | null;
  ocr_confidence?: 'high' | 'medium' | 'low' | null;
}

export interface VerifyProofData {
  proofId: string;
  bankVerified: boolean;
  adminNotes?: string;
  // Payment data for creating the payment record
  studentId: string;
  installmentId: string;
  amount: number;
}

export interface RejectProofData {
  proofId: string;
  rejectionReason: ProofRejectionReason;
  rejectionMessage?: string;
}

// Fetch payment proofs for a student (parent view)
export function useStudentPaymentProofs(studentId: string | undefined) {
  return useQuery({
    queryKey: ['payment-proofs', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentProof[];
    },
    enabled: !!studentId,
  });
}

// Fetch payment proofs for an installment
export function useInstallmentProof(studentId: string | undefined, installmentId: string | undefined) {
  return useQuery({
    queryKey: ['payment-proofs', 'installment', studentId, installmentId],
    queryFn: async () => {
      if (!studentId || !installmentId) return null;
      
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('student_id', studentId)
        .eq('installment_id', installmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PaymentProof | null;
    },
    enabled: !!studentId && !!installmentId,
  });
}

// Fetch all pending proofs for admin (school-wide)
export function usePendingPaymentProofs(schoolId: string | undefined) {
  return useQuery({
    queryKey: ['payment-proofs', 'pending', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      
      // First get all students for this school
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId);

      if (studentsError) throw studentsError;
      if (!students?.length) return [];

      const studentIds = students.map(s => s.id);

      // Then get pending proofs for these students
      const { data, error } = await supabase
        .from('payment_proofs')
        .select(`
          *,
          students!inner (
            id,
            name,
            class_name,
            section,
            roll_number
          ),
          installments!inner (
            id,
            name,
            amount,
            due_date,
            fee_structure_id,
            fee_structures!inner (
              id,
              fee_category_id,
              fee_categories!inner (
                id,
                name
              )
            )
          )
        `)
        .in('student_id', studentIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });
}

// Submit a payment proof (parent action)
export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proof: PaymentProofInsert) => {
      // First, delete any existing rejected proof for this installment
      await supabase
        .from('payment_proofs')
        .delete()
        .eq('student_id', proof.student_id)
        .eq('installment_id', proof.installment_id)
        .eq('status', 'rejected');

      // Insert the new proof
      const { data, error } = await supabase
        .from('payment_proofs')
        .insert(proof)
        .select()
        .single();

      if (error) throw error;
      return data as PaymentProof;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-proofs', 'student', variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ['payment-proofs', 'installment', variables.student_id, variables.installment_id] });
      queryClient.invalidateQueries({ queryKey: ['payment-proofs', 'pending'] });
    },
  });
}

// Verify a payment proof (admin action)
export function useVerifyPaymentProof() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();

  return useMutation({
    mutationFn: async ({ proofId, bankVerified, adminNotes, studentId, installmentId, amount }: VerifyProofData) => {
      if (isRestricted && !canPerform('verify_proof')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the proof status
      const { error: proofError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'verified' as ProofStatus,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          bank_verified: bankVerified,
          admin_notes: adminNotes || null,
        })
        .eq('id', proofId);

      if (proofError) throw proofError;

      // Create the payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: studentId,
          installment_id: installmentId,
          amount_paid: amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'Online (Proof Verified)',
          recorded_by: user.id,
          notes: `Verified from payment proof. ${bankVerified ? 'Bank verified.' : ''}`,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      return { proofId, payment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-proofs'] });
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      queryClient.invalidateQueries({ queryKey: ['fee-reports'] });
    },
  });
}

// Reject a payment proof (admin action)
export function useRejectPaymentProof() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();

  return useMutation({
    mutationFn: async ({ proofId, rejectionReason, rejectionMessage }: RejectProofData) => {
      if (isRestricted && !canPerform('reject_proof')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('payment_proofs')
        .update({
          status: 'rejected' as ProofStatus,
          rejection_reason: rejectionReason,
          rejection_message: rejectionMessage || null,
        })
        .eq('id', proofId);

      if (error) throw error;
      return { proofId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-proofs'] });
    },
  });
}

// Upload proof file to storage
export async function uploadProofFile(
  file: File,
  studentId: string,
  installmentId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${studentId}/${installmentId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
