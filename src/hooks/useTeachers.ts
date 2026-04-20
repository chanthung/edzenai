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

export interface UserInvite {
  id: string;
  email: string;
  name: string;
  role: string;
  school_id: string;
  delivery_method: 'email' | 'whatsapp' | 'both';
  phone: string | null;
  expires_at: string;
  accepted_at: string | null;
  last_sent_at: string;
  created_at: string;
}

export type InviteAssignment =
  | { type: 'subject'; subject_id: string; class_name: string }
  | { type: 'class'; class_name: string; section: string | null };

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

  const { data: invites = [] } = useQuery({
    queryKey: ['user-invites', school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data, error } = await supabase
        .from('user_invites' as any)
        .select('*')
        .eq('school_id', school.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserInvite[];
    },
    enabled: !!school?.id,
  });

  const inviteUser = useMutation({
    mutationFn: async (params: {
      name: string;
      email: string;
      role: 'teacher' | 'accountant';
      delivery_method: 'email' | 'whatsapp' | 'both';
      phone?: string | null;
      assignments?: InviteAssignment[];
    }) => {
      if (!school?.id) throw new Error('No school found');
      const { data, error } = await supabase.functions.invoke('create-user-invite', {
        body: { ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', school?.id] });
      toast.success(`Invite sent to ${vars.email}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send invite');
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase.functions.invoke('resend-user-invite', {
        body: { inviteId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', school?.id] });
      toast.success('Invite resent');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to resend invite');
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from('user_invites' as any).delete().eq('id', inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', school?.id] });
      toast.success('Invite cancelled');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to cancel invite');
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
      const { error } = await supabase.from('school_teachers').delete().eq('id', id);
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
    invites,
    isLoading,
    error,
    refetch,
    inviteUser,
    resendInvite,
    cancelInvite,
    updateTeacher,
    deleteTeacher,
  };
}
