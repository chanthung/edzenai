import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';

export interface FeeStructure {
  id: string;
  school_id: string;
  academic_year_id: string;
  fee_category_id: string;
  total_amount: number;
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

export function useCreateFeeStructure() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  
  return useMutation({
    mutationFn: async (structure: FeeStructureInsert) => {
      const { data, error } = await supabase
        .from('fee_structures')
        .insert({ ...structure, school_id: school!.id })
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
  
  return useMutation({
    mutationFn: async ({ id, academicYearId }: { id: string; academicYearId: string }) => {
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
  
  return useMutation({
    mutationFn: async (installment: InstallmentInsert) => {
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
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Installment> & { id: string }) => {
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
  
  return useMutation({
    mutationFn: async (id: string) => {
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
