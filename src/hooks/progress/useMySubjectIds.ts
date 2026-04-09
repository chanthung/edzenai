import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

export interface MySubjectClassAssignment {
  subjectId: string;
  className: string;
}

/**
 * For teachers: returns their assigned subject-class pairs from teacher_subject_assignments.
 * For admins: returns null (meaning "show all subjects").
 */
export function useMySubjectIds() {
  const { isTeacher } = useUserRole();

  const query = useQuery({
    queryKey: ['my-subject-ids'],
    queryFn: async (): Promise<MySubjectClassAssignment[] | null> => {
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

      // Get assigned subject-class pairs
      const { data: assignments, error } = await supabase
        .from('teacher_subject_assignments')
        .select('subject_id, class_name')
        .eq('teacher_id', teacher.id);

      if (error) throw error;
      return (assignments || []).map(a => ({ subjectId: a.subject_id, className: a.class_name }));
    },
    enabled: isTeacher,
  });

  // Convenience: deduplicated subject IDs (for hooks that just need subject filtering)
  const mySubjectIds = query.data
    ? [...new Set(query.data.map(a => a.subjectId))]
    : query.data; // null for admins, undefined while loading

  // Get subject IDs for a specific class
  const getSubjectIdsForClass = (className: string): string[] | null => {
    if (!query.data) return null; // admin or not loaded
    return [...new Set(
      query.data
        .filter(a => a.className === className)
        .map(a => a.subjectId)
    )];
  };

  return {
    ...query,
    mySubjectIds,
    getSubjectIdsForClass,
  };
}
