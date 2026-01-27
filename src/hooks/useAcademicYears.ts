import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYearInsert {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export function useAcademicYears() {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['academic-years', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school!.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!school,
  });
}

export function useActiveAcademicYear() {
  const { data: academicYears } = useAcademicYears();
  return academicYears?.find(year => year.is_active) ?? academicYears?.[0];
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (year: AcademicYearInsert) => {
      if (isRestricted && !canPerform('add_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('academic_years')
        .insert({ ...year, school_id: school!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicYear> & { id: string }) => {
      if (isRestricted && !canPerform('update_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('academic_years')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}
