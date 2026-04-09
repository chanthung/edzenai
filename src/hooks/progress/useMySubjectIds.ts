import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * For teachers: returns their assigned subject IDs from teacher_subject_assignments.
 * For admins: returns null (meaning "show all subjects").
 */
export function useMySubjectIds() {
  const { isTeacher } = useUserRole();

  return useQuery({
    queryKey: ['my-subject-ids'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get teacher record
      const { data: teacher } = await supabase
        .from('school_teachers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!teacher) return null;

      // Get assigned subject IDs
      const { data: assignments, error } = await supabase
        .from('teacher_subject_assignments')
        .select('subject_id')
        .eq('teacher_id', teacher.id);

      if (error) throw error;
      return (assignments || []).map(a => a.subject_id);
    },
    enabled: isTeacher,
  });
}
