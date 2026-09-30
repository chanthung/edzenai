import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';

export interface SchoolTeachingAssignment {
  teacher_id: string;
  subject_id: string;
  class_name: string;
}

/** Query-key prefix shared by all school-wide assignment reads (used for invalidation). */
export const SCHOOL_ASSIGNMENTS_KEY = ['teacher-subject-assignments', 'school'] as const;

/**
 * Shared read of the existing teacher_subject_assignments table for a whole
 * school + academic year in ONE query. Writes still go through
 * useTeacherSubjects().updateAssignments (the Edit Teacher save path).
 */
export function useSchoolTeachingAssignments(academicYearId: string | null | undefined, schoolIdOverride?: string | null) {
  const { data: school } = useSchool();
  const schoolId = schoolIdOverride ?? school?.id ?? null;

  return useQuery({
    queryKey: [...SCHOOL_ASSIGNMENTS_KEY, schoolId, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_subject_assignments')
        .select('teacher_id, subject_id, class_name')
        .eq('school_id', schoolId!)
        .eq('academic_year_id', academicYearId!);
      if (error) throw error;
      return (data ?? []) as SchoolTeachingAssignment[];
    },
    enabled: !!schoolId && !!academicYearId,
  });
}
