import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import { useToast } from '@/hooks/use-toast';

export interface Competency {
  id: string;
  subject_id: string;
  school_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export function useCompetencies(subjectId?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['competencies', schoolId, subjectId],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from('competencies')
        .select('*')
        .eq('school_id', schoolId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error } = await query.order('display_order').order('name');
      if (error) throw error;
      return data as Competency[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateCompetency() {
  const qc = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { subject_id: string; name: string; description?: string; display_order?: number }) => {
      if (!schoolId) throw new Error('No school');
      const { data, error } = await supabase
        .from('competencies')
        .insert({ school_id: schoolId, ...input, display_order: input.display_order ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competencies', schoolId] });
      toast({ title: 'Competency created' });
    },
    onError: (e) => toast({ title: 'Failed to create competency', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateCompetency() {
  const qc = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; display_order?: number }) => {
      const { data, error } = await supabase.from('competencies').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competencies', schoolId] });
      toast({ title: 'Competency updated' });
    },
    onError: (e) => toast({ title: 'Failed to update competency', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteCompetency() {
  const qc = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('competencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competencies', schoolId] });
      toast({ title: 'Competency deleted' });
    },
    onError: (e) => toast({ title: 'Failed to delete competency', description: e.message, variant: 'destructive' }),
  });
}
