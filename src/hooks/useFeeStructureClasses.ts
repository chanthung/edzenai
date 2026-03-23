import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';

export interface FeeStructureClass {
  id: string;
  fee_structure_id: string;
  class_name: string;
  auto_assign: boolean;
  new_admission_only: boolean;
  created_at: string;
}

export function useFeeStructureClasses(feeStructureId: string | undefined) {
  return useQuery({
    queryKey: ['fee-structure-classes', feeStructureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structure_classes')
        .select('*')
        .eq('fee_structure_id', feeStructureId!);
      if (error) throw error;
      return data as FeeStructureClass[];
    },
    enabled: !!feeStructureId,
  });
}

export function useAllFeeStructureClasses(academicYearId: string | undefined) {
  return useQuery({
    queryKey: ['fee-structure-classes', 'all', academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structure_classes')
        .select('*, fee_structure:fee_structures!inner(id, academic_year_id)')
        .eq('fee_structure.academic_year_id', academicYearId!);
      if (error) throw error;
      return data as (FeeStructureClass & { fee_structure: { id: string; academic_year_id: string } })[];
    },
    enabled: !!academicYearId,
  });
}

export function useUpdateFeeStructureClasses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      feeStructureId,
      classes,
      autoAssign,
    }: {
      feeStructureId: string;
      classes: string[];
      autoAssign: boolean;
    }) => {
      // Delete existing
      await supabase
        .from('fee_structure_classes')
        .delete()
        .eq('fee_structure_id', feeStructureId);

      // Insert new
      if (classes.length > 0) {
        const { error } = await supabase
          .from('fee_structure_classes')
          .insert(
            classes.map((c) => ({
              fee_structure_id: feeStructureId,
              class_name: c,
              auto_assign: autoAssign,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structure-classes'] });
    },
  });
}

export function useDistinctClasses() {
  const { data: school } = useSchool();

  return useQuery({
    queryKey: ['distinct-classes', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .eq('school_id', school!.id)
        .not('class_name', 'is', null)
        .order('class_name');
      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.class_name).filter(Boolean))] as string[];
      return unique;
    },
    enabled: !!school,
  });
}
