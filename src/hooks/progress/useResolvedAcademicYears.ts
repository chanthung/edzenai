import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import type { AcademicYear } from '@/hooks/useAcademicYears';

/**
 * Fetches academic years using the resolved school ID.
 * Works for both school admins and teachers.
 */
export function useResolvedAcademicYears() {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['academic-years-resolved', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!schoolId,
  });
}

export function useResolvedActiveAcademicYear() {
  const { data: academicYears } = useResolvedAcademicYears();
  return academicYears?.find((year) => year.is_active) ?? academicYears?.[0];
}
