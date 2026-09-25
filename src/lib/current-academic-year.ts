import { supabase } from '@/integrations/supabase/client';
import { resolveCurrentAcademicYearContext, type AcademicYear } from '@/hooks/useAcademicYears';

/** Resolve a school's single current academic year id (null when ambiguous or missing). */
export async function fetchCurrentAcademicYearId(schoolId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('school_id', schoolId);
  if (error) throw error;
  return resolveCurrentAcademicYearContext(data as AcademicYear[]).academic_year_id;
}
