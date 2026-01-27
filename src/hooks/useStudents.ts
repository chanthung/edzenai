import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export interface Student {
  id: string;
  school_id: string;
  name: string;
  roll_number: string | null;
  class_name: string | null;
  section: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  guardian: string | null;
  address: string | null;
  access_token: string;
  created_at: string;
  updated_at: string;
}

export interface StudentInsert {
  name: string;
  roll_number?: string;
  class_name?: string;
  section?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  guardian?: string;
  address?: string;
}

export function useStudents() {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['students', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', school!.id)
        .order('name');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!school,
  });
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId!)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      if (isRestricted && !canPerform('add_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('students')
        .insert({ ...student, school_id: school!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      if (isRestricted && !canPerform('edit_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
    },
  });
}
