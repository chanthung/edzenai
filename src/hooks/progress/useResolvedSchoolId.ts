import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Resolves the school ID for the currently logged-in user.
 * Works for both school admins (via school_admins table) and
 * teachers (via school_teachers table / get_teacher_school_ids RPC).
 */
export function useResolvedSchoolId() {
  const { data: school } = useSchool();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resolved-school-id', user?.id, school?.id],
    queryFn: async () => {
      // Admin path: school already resolved via useSchool
      if (school?.id) return school.id;

      // Teacher path: get school id via RPC
      const { data, error } = await supabase.rpc('get_teacher_school_ids');
      if (error) throw error;
      const ids = data as string[];
      return ids?.[0] ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
