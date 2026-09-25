import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { toast } from 'sonner';

export interface TeacherSubjectClassAssignment {
  subject_id: string;
  class_name: string;
}

/**
 * Year-scoped teacher subject/class assignments.
 * Only rows for `academicYearId` are read or modified; rows of other years
 * (and legacy rows without a year) are never touched.
 */
export function useTeacherSubjects(teacherId?: string, academicYearId?: string | null) {
  const { data: school } = useSchool();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['teacher-subject-assignments', teacherId, academicYearId],
    queryFn: async () => {
      if (!teacherId || !academicYearId) return [];
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select('subject_id, class_name')
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', academicYearId);
      if (error) throw error;
      return data as TeacherSubjectClassAssignment[];
    },
    enabled: !!teacherId && !!academicYearId,
  });

  // Legacy rows that have no academic year yet (shown as info only)
  const { data: yearlessCount = 0 } = useQuery({
    queryKey: ['teacher-subject-assignments-yearless', teacherId],
    queryFn: async () => {
      if (!teacherId) return 0;
      const { count, error } = await supabase
        .from('teacher_subject_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .is('academic_year_id', null);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!teacherId,
  });

  const assignedSubjectIds = [...new Set(assignments.map(a => a.subject_id))];

  const queryClient = useQueryClient();

  const updateAssignments = useMutation({
    mutationFn: async ({ teacherId, academicYearId, assignments: newAssignments }: { teacherId: string; academicYearId: string; assignments: TeacherSubjectClassAssignment[] }) => {
      if (!school?.id) throw new Error('No school found');
      if (!academicYearId) throw new Error('No current academic year is set');

      // Delete only this year's rows
      const { error: delError } = await supabase
        .from('teacher_subject_assignments')
        .delete()
        .eq('teacher_id', teacherId)
        .eq('academic_year_id', academicYearId);
      if (delError) throw delError;

      if (newAssignments.length > 0) {
        const rows = newAssignments.map(a => ({
          teacher_id: teacherId,
          subject_id: a.subject_id,
          class_name: a.class_name,
          school_id: school.id,
          academic_year_id: academicYearId,
        }));
        const { error } = await supabase.from('teacher_subject_assignments').insert(rows);
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

  return { assignments, assignedSubjectIds, yearlessCount, isLoading, updateAssignments };
}
