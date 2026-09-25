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
export function todayLocalISO(): string {
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

export type AcademicYearIssue = 'no_current' | 'multiple_active' | 'overlap' | 'mismatch' | 'error';

export interface CurrentAcademicYearContext {
  /** The school's single current operational year (null when it can't be determined safely). */
  year: AcademicYear | null;
  academic_year_id: string | null;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  isLoading: boolean;
  isValid: boolean;
  issues: AcademicYearIssue[];
  activeYears: AcademicYear[];
  dateMatches: AcademicYear[];
  /** Human-readable warning for administrators, or null. */
  warning: string | null;
}

/**
 * Shared current-academic-year resolver. Current = the single active year.
 * The date range (start_date <= today <= end_date) is cross-checked; any
 * disagreement is surfaced as a warning — data is never changed silently.
 */
export function resolveCurrentAcademicYearContext(
  years: AcademicYear[] | undefined,
  today: string = todayLocalISO(),
): Omit<CurrentAcademicYearContext, 'isLoading'> {
  const list = years ?? [];
  const activeYears = list.filter((y) => y.is_active);
  const dateMatches = resolveCurrentAcademicYear(list, today).matches;
  const issues: AcademicYearIssue[] = [];
  let year: AcademicYear | null = null;

  if (activeYears.length > 1) issues.push('multiple_active');
  if (dateMatches.length > 1) issues.push('overlap');

  if (activeYears.length === 1) year = activeYears[0];
  else if (activeYears.length === 0 && dateMatches.length === 1) year = dateMatches[0];

  if (!year && !issues.includes('multiple_active')) issues.push('no_current');
  if (year && activeYears.length === 1 && dateMatches.length === 1 && dateMatches[0].id !== year.id) {
    issues.push('mismatch');
  }
  if (year && activeYears.length === 1 && dateMatches.length === 0) issues.push('mismatch');

  const warnings: string[] = [];
  if (issues.includes('multiple_active'))
    warnings.push(`More than one academic year is marked active (${activeYears.map((y) => y.name).join(', ')}). Activate only one in Academic Years.`);
  if (issues.includes('overlap'))
    warnings.push(`Academic year dates overlap today (${dateMatches.map((y) => y.name).join(', ')}).`);
  if (issues.includes('no_current')) warnings.push('No current academic year is set. Create or activate one in Academic Years.');
  if (issues.includes('mismatch'))
    warnings.push(
      dateMatches.length === 1
        ? `The active year (${year?.name}) differs from the year covering today's date (${dateMatches[0].name}).`
        : `Today's date is outside the active year (${year?.name}).`,
    );

  return {
    year: issues.includes('multiple_active') ? null : year,
    academic_year_id: issues.includes('multiple_active') ? null : year?.id ?? null,
    name: issues.includes('multiple_active') ? null : year?.name ?? null,
    start_date: issues.includes('multiple_active') ? null : year?.start_date ?? null,
    end_date: issues.includes('multiple_active') ? null : year?.end_date ?? null,
    isValid: !!year && !issues.includes('multiple_active'),
    issues,
    activeYears,
    dateMatches,
    warning: warnings.length ? warnings.join(' ') : null,
  };
}

export function useCurrentAcademicYearContext(): CurrentAcademicYearContext {
  const { data, isLoading, error } = useAcademicYears();
  if (isLoading) {
    return {
      year: null, academic_year_id: null, name: null, start_date: null, end_date: null,
      isLoading: true, isValid: false, issues: [], activeYears: [], dateMatches: [], warning: null,
    };
  }
  if (error) {
    return {
      year: null, academic_year_id: null, name: null, start_date: null, end_date: null,
      isLoading: false, isValid: false, issues: ['error'], activeYears: [], dateMatches: [],
      warning: 'Could not load academic years.',
    };
  }
  return { ...resolveCurrentAcademicYearContext(data), isLoading: false };
}

/** Deactivate every other active year of the school (only the is_active flag changes). */
async function deactivateOtherYears(schoolId: string, keepId?: string) {
  let q = supabase.from('academic_years').update({ is_active: false }).eq('school_id', schoolId).eq('is_active', true);
  if (keepId) q = q.neq('id', keepId);
  const { error } = await q;
  if (error) throw error;
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
      
      if (year.is_active && year.end_date < todayLocalISO()) {
        throw new Error('A past academic year cannot be made current.');
      }
      if (year.is_active) await deactivateOtherYears(school!.id);
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
      
      if (updates.is_active === true) {
        const { data: target, error: tErr } = await supabase.from('academic_years').select('end_date').eq('id', id).single();
        if (tErr) throw tErr;
        if (target?.end_date && target.end_date < todayLocalISO()) {
          throw new Error('A past academic year cannot be made current.');
        }
        await deactivateOtherYears(school!.id, id);
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

export type AcademicYearPhase = 'past' | 'current' | 'future';

export function academicYearPhase(y: AcademicYear, today: string = todayLocalISO()): AcademicYearPhase {
  if (y.end_date < today) return 'past';
  if (y.start_date > today) return 'future';
  return 'current';
}

/**
 * Decide whether the active flag needs an automatic, safe correction.
 * Returns the id to make current, or null when nothing should change.
 * Only acts when exactly one year covers today and the active state is wrong
 * (none active, several active, or a past year active). An explicitly
 * activated future year is respected. Dates are never touched.
 */
export function autoCurrentYearTarget(years: AcademicYear[] | undefined, today: string = todayLocalISO()): string | null {
  if (!years?.length) return null;
  const matches = resolveCurrentAcademicYear(years, today).matches;
  if (matches.length !== 1) return null;
  const active = years.filter((y) => y.is_active);
  if (active.length === 1 && active[0].id === matches[0].id) return null;
  if (active.length === 1 && academicYearPhase(active[0], today) === 'future') return null;
  return matches[0].id;
}
