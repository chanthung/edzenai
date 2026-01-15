import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudentFee {
  id: string;
  student_id: string;
  fee_structure_id: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  installment_id: string;
  amount_paid: number;
  payment_date: string;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentInsert {
  student_id: string;
  installment_id: string;
  amount_paid: number;
  payment_date: string;
  payment_mode?: string;
  reference_number?: string;
  notes?: string;
}

export function useStudentFees(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-fees', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          fee_structure:fee_structures(
            *,
            fee_category:fee_categories(id, name, is_mandatory),
            installments(*)
          )
        `)
        .eq('student_id', studentId!);
      
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });
}

export function useStudentPayments(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-payments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId!)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!studentId,
  });
}

export function useAssignFeeStructure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, feeStructureId }: { studentId: string; feeStructureId: string }) => {
      const { data, error } = await supabase
        .from('student_fees')
        .insert({ student_id: studentId, fee_structure_id: feeStructureId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-fees', data.student_id] });
    },
  });
}

export function useRemoveFeeStructure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, feeStructureId }: { studentId: string; feeStructureId: string }) => {
      const { error } = await supabase
        .from('student_fees')
        .delete()
        .eq('student_id', studentId)
        .eq('fee_structure_id', feeStructureId);
      
      if (error) throw error;
      return { studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-fees', data.studentId] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: PaymentInsert) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-payments', data.student_id] });
      queryClient.invalidateQueries({ queryKey: ['student-fees', data.student_id] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, studentId }: { id: string; studentId: string }) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { studentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-payments', data.studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-fees', data.studentId] });
    },
  });
}
