import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import type { Student } from '@/hooks/useStudents';

/**
 * Fetches students using the resolved school ID.
 * Works for both school admins and teachers.
 */
export function useResolvedStudents() {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['students-resolved', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!schoolId,
  });
}
