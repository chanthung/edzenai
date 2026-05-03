import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export type GenerationType = 'manual' | 'monthly' | 'term' | 'full';

export interface FeeStructure {
  id: string;
  school_id: string;
  academic_year_id: string;
  fee_category_id: string;
  total_amount: number;
  generation_type: GenerationType;
  created_at: string;
  updated_at: string;
  fee_category?: {
    id: string;
    name: string;
    is_mandatory: boolean;
  };
  installments?: Installment[];
}

export interface Installment {
  id: string;
  fee_structure_id: string;
  name: string;
  amount: number;
  due_date: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FeeStructureInsert {
  academic_year_id: string;
  fee_category_id: string;
  total_amount: number;
  due_date?: string;
  generation_type?: GenerationType;
  year_start?: string;
  year_end?: string;
}

export interface InstallmentInsert {
  fee_structure_id: string;
  name: string;
  amount: number;
  due_date: string;
  display_order?: number;
}

export function useFeeStructures(academicYearId: string | undefined) {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['fee-structures', academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select(`
          *,
          fee_category:fee_categories(id, name, is_mandatory),
          installments(*)
        `)
        .eq('academic_year_id', academicYearId!)
        .eq('school_id', school!.id);
      
      if (error) throw error;
      return data as FeeStructure[];
    },
    enabled: !!academicYearId && !!school,
  });
}
/** Generate installment rows based on generation type */
function generateInstallments(
  type: GenerationType,
  totalAmount: number,
  dueDate?: string,
  yearStart?: string,
  yearEnd?: string,
): { name: string; amount: number; due_date: string }[] {
  const fallbackDue = dueDate || (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  })();

  if (type === 'full' || type === 'manual') {
    return [{ name: 'Full Payment', amount: totalAmount, due_date: fallbackDue }];
  }

  if (type === 'term') {
    const termAmount = Math.floor(totalAmount / 3);
    const remainder = totalAmount - termAmount * 3;
    const start = yearStart ? new Date(yearStart) : new Date();
    return [1, 2, 3].map((t) => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + (t - 1) * 4); // ~4 months apart
      return {
        name: `Term ${t}`,
        amount: t === 1 ? termAmount + remainder : termAmount,
        due_date: d.toISOString().split('T')[0],
      };
    });
  }

  if (type === 'monthly') {
    if (!yearStart || !yearEnd) {
      return [{ name: 'Full Payment', amount: totalAmount, due_date: fallbackDue }];
    }
    const start = new Date(yearStart);
    const end = new Date(yearEnd);
    const months: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 10);
    while (cursor <= end) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    if (months.length === 0) {
      return [{ name: 'Full Payment', amount: totalAmount, due_date: fallbackDue }];
    }
    const monthlyAmount = Math.floor(totalAmount / months.length);
    const remainder = totalAmount - monthlyAmount * months.length;
    return months.map((d, i) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        name: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        amount: i === 0 ? monthlyAmount + remainder : monthlyAmount,
        due_date: d.toISOString().split('T')[0],
      };
    });
  }

  return [{ name: 'Full Payment', amount: totalAmount, due_date: fallbackDue }];
}


  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (structure: FeeStructureInsert) => {
      if (isRestricted && !canPerform('add_fee_structure')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }

      const genType = structure.generation_type || 'full';
      
      const { data: feeStructure, error } = await supabase
        .from('fee_structures')
        .insert({
          academic_year_id: structure.academic_year_id,
          fee_category_id: structure.fee_category_id,
          total_amount: structure.total_amount,
          generation_type: genType,
          school_id: school!.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Generate installments based on type
      const installments = generateInstallments(
        genType,
        structure.total_amount,
        structure.due_date,
        structure.year_start,
        structure.year_end,
      );

      if (installments.length > 0) {
        const { error: instError } = await supabase.from('installments').insert(
          installments.map((inst, idx) => ({
            fee_structure_id: feeStructure.id,
            name: inst.name,
            amount: inst.amount,
            due_date: inst.due_date,
            display_order: idx + 1,
          }))
        );
        if (instError) throw instError;
      }

      return feeStructure;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures', data.academic_year_id] });
    },
  });
}

export function useUpdateFeeStructure() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeeStructure> & { id: string }) => {
      const { data, error } = await supabase
        .from('fee_structures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures', data.academic_year_id] });
    },
  });
}

export function useDeleteFeeStructure() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, academicYearId }: { id: string; academicYearId: string }) => {
      if (isRestricted && !canPerform('delete_fee_structure')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { academicYearId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures', data.academicYearId] });
    },
  });
}

// Installment mutations
export function useCreateInstallment() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (installment: InstallmentInsert) => {
      if (isRestricted && !canPerform('add_installment')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('installments')
        .insert(installment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Installment> & { id: string }) => {
      if (isRestricted && !canPerform('edit_installment')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('installments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}

export function useDeleteInstallment() {
  const queryClient = useQueryClient();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_installment')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}
