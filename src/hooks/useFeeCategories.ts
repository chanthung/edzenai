import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export interface FeeCategory {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  display_order: number;
  category_group: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeeCategoryInsert {
  name: string;
  description?: string;
  is_mandatory?: boolean;
  display_order?: number;
}

export function useFeeCategories() {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['fee-categories', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_categories')
        .select('*')
        .eq('school_id', school!.id)
        .order('display_order');
      
      if (error) throw error;
      return data as FeeCategory[];
    },
    enabled: !!school,
  });
}

export function useCreateFeeCategory() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (category: FeeCategoryInsert) => {
      if (isRestricted && !canPerform('add_fee_category')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('fee_categories')
        .insert({ ...category, school_id: school!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-categories', school?.id] });
    },
  });
}

export function useUpdateFeeCategory() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeeCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('fee_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-categories', school?.id] });
    },
  });
}

export function useDeleteFeeCategory() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_fee_category')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('fee_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-categories', school?.id] });
    },
  });
}
