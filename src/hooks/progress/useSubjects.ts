import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';
import { useToast } from '@/hooks/use-toast';

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  class_name: string | null;
  display_order: number | null;
  created_at: string | null;
}

export function useSubjects(className?: string) {
  const { data: school } = useSchool();
  const schoolId = school?.id;

  return useQuery({
    queryKey: ['subjects', schoolId, className],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId);

      // Filter by class_name when provided
      if (className) {
        query = query.eq('class_name', className);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Subject[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (subject: { name: string; code?: string; class_name?: string; display_order?: number }) => {
      if (!school?.id) throw new Error('No school found');

      const { data, error } = await supabase
        .from('subjects')
        .insert({
          school_id: school.id,
          name: subject.name,
          code: subject.code || null,
          class_name: subject.class_name || null,
          display_order: subject.display_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', school?.id] });
      toast({ title: 'Subject created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create subject', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; code?: string; class_name?: string; display_order?: number }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', school?.id] });
      toast({ title: 'Subject updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update subject', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', school?.id] });
      toast({ title: 'Subject deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete subject', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}
