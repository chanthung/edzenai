import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTeachers() {
  const { data: school } = useSchool();
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['teachers', school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      
      const { data, error } = await supabase
        .from('school_teachers')
        .select('*')
        .eq('school_id', school.id)
        .order('name');

      if (error) throw error;
      return (data as any[]).map(d => ({ ...d, role: d.role ?? 'teacher' })) as Teacher[];
    },
    enabled: !!school?.id,
  });

  const createTeacher = useMutation({
    mutationFn: async ({ name, email, password, role = 'teacher' }: { name: string; email: string; password: string; role?: string }) => {
      if (!school?.id) throw new Error('No school found');

      const { data: authData, error: authError } = await supabase.functions.invoke('create-teacher', {
        body: { name, email, password, schoolId: school.id, role },
      });

      if (authError) throw authError;
      if (authData?.error) throw new Error(authData.error);

      return authData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers', school?.id] });
      const label = variables.role === 'accountant' ? 'Accountant' : 'Teacher';
      toast.success(`${label} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async ({ id, name, is_active }: { id: string; name: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('school_teachers')
        .update({ name, is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', school?.id] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const deleteTeacher = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', school?.id] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  return {
    teachers,
    isLoading,
    error,
    refetch,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  };
}
