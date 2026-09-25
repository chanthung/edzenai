import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYearInsert {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export function useAcademicYears() {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['academic-years', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school!.id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!school,
  });
}

export function useActiveAcademicYear() {
  const { data: academicYears } = useAcademicYears();
  return academicYears?.find(year => year.is_active) ?? academicYears?.[0];
}

export type CurrentAcademicYearStatus = 'loading' | 'ok' | 'overlap' | 'none';

export interface CurrentAcademicYearResult {
  status: CurrentAcademicYearStatus;
  year: AcademicYear | null;
  matches: AcademicYear[];
}

/** Local calendar date as YYYY-MM-DD (avoids UTC shifting the day). */
function todayLocalISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Date-based current academic year: start_date <= today <= end_date.
 * Never picks by is_active. Exactly one match => 'ok'; several => 'overlap'; zero => 'none'.
 */
export function resolveCurrentAcademicYear(
  years: AcademicYear[] | undefined,
  today: string = todayLocalISO(),
): CurrentAcademicYearResult {
  if (!years) return { status: 'loading', year: null, matches: [] };
  const matches = years.filter(
    (y) => y.start_date && y.end_date && y.start_date <= today && today <= y.end_date,
  );
  if (matches.length === 1) return { status: 'ok', year: matches[0], matches };
  if (matches.length > 1) return { status: 'overlap', year: null, matches };
  return { status: 'none', year: null, matches };
}

export function useCurrentAcademicYear(): CurrentAcademicYearResult {
  const { data: academicYears, isLoading } = useAcademicYears();
  if (isLoading) return { status: 'loading', year: null, matches: [] };
  return resolveCurrentAcademicYear(academicYears ?? []);
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (year: AcademicYearInsert) => {
      if (isRestricted && !canPerform('add_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('academic_years')
        .insert({ ...year, school_id: school!.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AcademicYear> & { id: string }) => {
      if (isRestricted && !canPerform('update_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('academic_years')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_academic_year')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years', school?.id] });
    },
  });
}
