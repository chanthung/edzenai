import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { toast } from 'sonner';

export interface TeacherClassAssignment {
  class_name: string;
  section: string | null;
}

export function useTeacherClasses(teacherId?: string) {
  const { data: school } = useSchool();

  const { data: assignedClasses = [], isLoading } = useQuery({
    queryKey: ['teacher-class-assignments', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select('class_name, section')
        .eq('teacher_id', teacherId);
      if (error) throw error;
      return data as TeacherClassAssignment[];
    },
    enabled: !!teacherId,
  });

  const queryClient = useQueryClient();

  const updateAssignments = useMutation({
    mutationFn: async ({ teacherId, assignments }: { teacherId: string; assignments: TeacherClassAssignment[] }) => {
      if (!school?.id) throw new Error('No school found');

      // Delete existing
      await supabase
        .from('teacher_class_assignments')
        .delete()
        .eq('teacher_id', teacherId);

      // Insert new
      if (assignments.length > 0) {
        const rows = assignments.map(a => ({
          teacher_id: teacherId,
          class_name: a.class_name,
          section: a.section || null,
          school_id: school.id,
        }));
        const { error } = await supabase
          .from('teacher_class_assignments')
          .insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-class-assignments', vars.teacherId] });
      toast.success('Class assignments updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update class assignments');
    },
  });

  return { assignedClasses, isLoading, updateAssignments };
}

/**
 * For the current logged-in teacher, fetch their assigned classes.
 */
export function useMyClassAssignments() {
  return useQuery({
    queryKey: ['my-class-assignments'],
    queryFn: async () => {
      // Get current teacher record
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: teacher } = await supabase
        .from('school_teachers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!teacher) return [];

      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select('class_name, section')
        .eq('teacher_id', teacher.id);

      if (error) throw error;
      return data as TeacherClassAssignment[];
    },
  });
}
