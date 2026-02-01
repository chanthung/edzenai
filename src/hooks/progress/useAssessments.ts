import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';
import { useToast } from '@/hooks/use-toast';

export interface Assessment {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  assessment_type: string;
  assessment_date: string | null;
  class_name: string | null;
  created_at: string | null;
}

export function useAssessments(academicYearId?: string, className?: string) {
  const { data: school } = useSchool();
  const schoolId = school?.id;

  return useQuery({
    queryKey: ['assessments', schoolId, academicYearId, className],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from('assessments')
        .select('*')
        .eq('school_id', schoolId)
        .order('assessment_date', { ascending: false, nullsFirst: false });

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId);
      }

      if (className) {
        query = query.or(`class_name.eq.${className},class_name.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Assessment[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assessment: {
      academic_year_id: string;
      name: string;
      assessment_type: string;
      assessment_date?: string;
      class_name?: string;
    }) => {
      if (!school?.id) throw new Error('No school found');

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          school_id: school.id,
          academic_year_id: assessment.academic_year_id,
          name: assessment.name,
          assessment_type: assessment.assessment_type,
          assessment_date: assessment.assessment_date || null,
          class_name: assessment.class_name || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', school?.id] });
      toast({ title: 'Assessment created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create assessment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      assessment_type?: string;
      assessment_date?: string;
      class_name?: string;
    }) => {
      const { data, error } = await supabase
        .from('assessments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', school?.id] });
      toast({ title: 'Assessment updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update assessment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assessments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', school?.id] });
      toast({ title: 'Assessment deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete assessment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
