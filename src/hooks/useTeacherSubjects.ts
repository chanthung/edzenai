import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { toast } from 'sonner';

export interface TeacherSubjectClassAssignment {
  subject_id: string;
  class_name: string;
}

export function useTeacherSubjects(teacherId?: string) {
  const { data: school } = useSchool();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['teacher-subject-assignments', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select('subject_id, class_name')
        .eq('teacher_id', teacherId);
      if (error) throw error;
      return data as TeacherSubjectClassAssignment[];
    },
    enabled: !!teacherId,
  });

  // Deduplicated subject IDs for backward compatibility
  const assignedSubjectIds = [...new Set(assignments.map(a => a.subject_id))];

  const queryClient = useQueryClient();

  const updateAssignments = useMutation({
    mutationFn: async ({ teacherId, assignments: newAssignments }: { teacherId: string; assignments: TeacherSubjectClassAssignment[] }) => {
      if (!school?.id) throw new Error('No school found');

      // Delete existing
      await supabase
        .from('teacher_subject_assignments')
        .delete()
        .eq('teacher_id', teacherId);

      // Insert new
      if (newAssignments.length > 0) {
        const rows = newAssignments.map(a => ({
          teacher_id: teacherId,
          subject_id: a.subject_id,
          class_name: a.class_name,
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

  return { assignments, assignedSubjectIds, isLoading, updateAssignments };
}
