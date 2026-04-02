import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { toast } from 'sonner';

export function useTeacherSubjects(teacherId?: string) {
  const { data: school } = useSchool();

  const { data: assignedSubjectIds = [], isLoading } = useQuery({
    queryKey: ['teacher-subject-assignments', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select('subject_id')
        .eq('teacher_id', teacherId);
      if (error) throw error;
      return data.map(d => d.subject_id);
    },
    enabled: !!teacherId,
  });

  const queryClient = useQueryClient();

  const updateAssignments = useMutation({
    mutationFn: async ({ teacherId, subjectIds }: { teacherId: string; subjectIds: string[] }) => {
      if (!school?.id) throw new Error('No school found');

      // Delete existing
      await supabase
        .from('teacher_subject_assignments')
        .delete()
        .eq('teacher_id', teacherId);

      // Insert new
      if (subjectIds.length > 0) {
        const rows = subjectIds.map(sid => ({
          teacher_id: teacherId,
          subject_id: sid,
          school_id: school.id,
        }));
        const { error } = await supabase
          .from('teacher_subject_assignments')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-subject-assignments', vars.teacherId] });
      toast.success('Subject assignments updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update subject assignments');
    },
  });

  return { assignedSubjectIds, isLoading, updateAssignments };
}
