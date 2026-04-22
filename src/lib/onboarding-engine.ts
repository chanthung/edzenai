/**
 * One-Click School Onboarding Engine.
 *
 * Pure helper that takes a configuration and:
 *  - returns a previewSummary() (counts only, no DB writes)
 *  - exposes executeOnboarding() that runs the ordered idempotent steps:
 *      1. UPDATE schools (board, default_classes, default_sections, onboarding_completed)
 *      2. INSERT academic_year (skip if name exists for school)
 *      3. INSERT subjects + subject_class_assignments (case-insensitive dedupe)
 *      4. INSERT fee_categories (skip if name exists for school)
 *      5. INSERT fee_structures + auto-create "Full Payment" installment
 *
 * Safe to re-run — every step skips work that's already done.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  classifyClass,
  getSuggestions,
  type Board,
  type ClassGroup,
  type Stream,
  type SubjectSuggestion,
} from '@/lib/subject-library';

export interface OnboardingFeeRow {
  name: string;
  amount: number;
  is_mandatory: boolean;
  enabled: boolean;
}

export interface OnboardingConfig {
  schoolId: string;
  schoolName: string;
  board: Board;
  yearName: string;
  yearStart: string; // YYYY-MM-DD
  yearEnd: string;   // YYYY-MM-DD
  classes: string[];
  sections: string[];
  streams: Stream[];
  fees: OnboardingFeeRow[];
}

export interface PreviewSummary {
  yearName: string;
  yearStart: string;
  yearEnd: string;
  classCount: number;
  sectionCount: number;
  totalSubjects: number;
  subjectsByGroup: Record<ClassGroup, number>;
  feeCategoryCount: number;
  feeStructureCount: number;
}

export interface OnboardingResult {
  yearCreated: boolean;
  subjectsCreated: number;
  subjectsExisting: number;
  classAssignments: number;
  feeCategoriesCreated: number;
  feeStructuresCreated: number;
  errors: string[];
}

/** Group selected classes by ClassGroup. */
function groupClasses(classes: string[]): Record<ClassGroup, string[]> {
  const groups: Record<ClassGroup, string[]> = {
    pre_primary: [],
    primary: [],
    middle: [],
    secondary: [],
    senior: [],
  };
  for (const c of classes) {
    const g = classifyClass(c);
    if (g) groups[g].push(c);
  }
  return groups;
}

/** For each subject, derive which selected class names it should be assigned to. */
function buildSubjectPlan(
  board: Board,
  classes: string[],
  streams: Stream[],
): Map<string, { suggestion: SubjectSuggestion; classNames: Set<string> }> {
  const grouped = groupClasses(classes);
  const plan = new Map<string, { suggestion: SubjectSuggestion; classNames: Set<string> }>();

  const addSubject = (s: SubjectSuggestion, classNames: string[]) => {
    const key = s.name.toLowerCase();
    let entry = plan.get(key);
    if (!entry) {
      entry = { suggestion: s, classNames: new Set() };
      plan.set(key, entry);
    }
    classNames.forEach((cn) => entry!.classNames.add(cn));
  };

  // Non-senior groups
  (['pre_primary', 'primary', 'middle', 'secondary'] as ClassGroup[]).forEach((g) => {
    if (grouped[g].length === 0) return;
    const subs = getSuggestions(board, [g]);
    subs.forEach((s) => addSubject(s, grouped[g]));
  });

  // Senior + each chosen stream
  if (grouped.senior.length > 0) {
    // Common senior subjects (English etc.) without stream
    const baseSenior = getSuggestions(board, ['senior']);
    baseSenior.forEach((s) => addSubject(s, grouped.senior));
    // Per stream
    streams.forEach((stream) => {
      const streamSubs = getSuggestions(board, ['senior'], stream);
      streamSubs.forEach((s) => addSubject(s, grouped.senior));
    });
  }

  return plan;
}

export function previewSummary(cfg: OnboardingConfig): PreviewSummary {
  const grouped = groupClasses(cfg.classes);
  const plan = buildSubjectPlan(cfg.board, cfg.classes, cfg.streams);

  const subjectsByGroup: Record<ClassGroup, number> = {
    pre_primary: 0,
    primary: 0,
    middle: 0,
    secondary: 0,
    senior: 0,
  };
  (Object.keys(grouped) as ClassGroup[]).forEach((g) => {
    if (grouped[g].length === 0) return;
    if (g === 'senior') {
      const baseSenior = getSuggestions(cfg.board, ['senior']);
      const streamCount = cfg.streams.reduce(
        (acc, s) => acc + getSuggestions(cfg.board, ['senior'], s).filter(
          (sub) => !baseSenior.some((b) => b.name.toLowerCase() === sub.name.toLowerCase())
        ).length,
        0,
      );
      subjectsByGroup.senior = baseSenior.length + streamCount;
    } else {
      subjectsByGroup[g] = getSuggestions(cfg.board, [g]).length;
    }
  });

  const enabledFees = cfg.fees.filter((f) => f.enabled && f.amount > 0);

  return {
    yearName: cfg.yearName,
    yearStart: cfg.yearStart,
    yearEnd: cfg.yearEnd,
    classCount: cfg.classes.length,
    sectionCount: cfg.sections.length,
    totalSubjects: plan.size,
    subjectsByGroup,
    feeCategoryCount: enabledFees.length,
    feeStructureCount: enabledFees.length,
  };
}

export async function executeOnboarding(cfg: OnboardingConfig): Promise<OnboardingResult> {
  const result: OnboardingResult = {
    yearCreated: false,
    subjectsCreated: 0,
    subjectsExisting: 0,
    classAssignments: 0,
    feeCategoriesCreated: 0,
    feeStructuresCreated: 0,
    errors: [],
  };

  // STEP 1: Update school
  try {
    const { error } = await supabase
      .from('schools')
      .update({
        name: cfg.schoolName,
        board: cfg.board,
        default_classes: cfg.classes,
        default_sections: cfg.sections,
        onboarding_completed: true,
      } as never)
      .eq('id', cfg.schoolId);
    if (error) throw error;
  } catch (e: unknown) {
    result.errors.push(`School update: ${(e as Error).message}`);
  }

  // STEP 2: Academic year (skip if name exists)
  let academicYearId: string | null = null;
  try {
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id, is_active')
      .eq('school_id', cfg.schoolId)
      .eq('name', cfg.yearName)
      .maybeSingle();

    if (existing) {
      academicYearId = existing.id;
    } else {
      const { data, error } = await supabase
        .from('academic_years')
        .insert({
          school_id: cfg.schoolId,
          name: cfg.yearName,
          start_date: cfg.yearStart,
          end_date: cfg.yearEnd,
          is_active: true,
        })
        .select('id')
        .single();
      if (error) throw error;
      academicYearId = data.id;
      result.yearCreated = true;
    }
  } catch (e: unknown) {
    result.errors.push(`Academic year: ${(e as Error).message}`);
  }

  // STEP 3: Subjects + class assignments
  try {
    const plan = buildSubjectPlan(cfg.board, cfg.classes, cfg.streams);

    for (const { suggestion, classNames } of plan.values()) {
      // Find existing subject (case-insensitive name + same type)
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .eq('school_id', cfg.schoolId)
        .ilike('name', suggestion.name)
        .eq('subject_type', suggestion.type)
        .maybeSingle();

      let subjectId: string;
      if (existing) {
        subjectId = existing.id;
        result.subjectsExisting++;
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            school_id: cfg.schoolId,
            name: suggestion.name,
            code: suggestion.code || null,
            subject_type: suggestion.type,
            display_order: 0,
          })
          .select('id')
          .single();
        if (error) throw error;
        subjectId = data.id;
        result.subjectsCreated++;
      }

      const assignments = Array.from(classNames).map((cn) => ({
        subject_id: subjectId,
        school_id: cfg.schoolId,
        class_name: cn,
      }));
      if (assignments.length > 0) {
        const { error: aErr } = await supabase
          .from('subject_class_assignments')
          .upsert(assignments, { onConflict: 'subject_id,class_name' });
        if (aErr) throw aErr;
        result.classAssignments += assignments.length;
      }
    }
  } catch (e: unknown) {
    result.errors.push(`Subjects: ${(e as Error).message}`);
  }

  // STEP 4 & 5: Fee categories + structures
  if (academicYearId) {
    const enabledFees = cfg.fees.filter((f) => f.enabled && f.amount > 0);
    for (const fee of enabledFees) {
      try {
        // Find or create category
        const { data: existingCat } = await supabase
          .from('fee_categories')
          .select('id')
          .eq('school_id', cfg.schoolId)
          .ilike('name', fee.name)
          .maybeSingle();

        let categoryId: string;
        if (existingCat) {
          categoryId = existingCat.id;
        } else {
          const { data, error } = await supabase
            .from('fee_categories')
            .insert({
              school_id: cfg.schoolId,
              name: fee.name,
              is_mandatory: fee.is_mandatory,
              display_order: 0,
            })
            .select('id')
            .single();
          if (error) throw error;
          categoryId = data.id;
          result.feeCategoriesCreated++;
        }

        // Find or create fee structure for (year × category)
        const { data: existingStruct } = await supabase
          .from('fee_structures')
          .select('id')
          .eq('school_id', cfg.schoolId)
          .eq('academic_year_id', academicYearId)
          .eq('fee_category_id', categoryId)
          .maybeSingle();

        if (!existingStruct) {
          const { data: structData, error: sErr } = await supabase
            .from('fee_structures')
            .insert({
              school_id: cfg.schoolId,
              academic_year_id: academicYearId,
              fee_category_id: categoryId,
              total_amount: fee.amount,
            })
            .select('id')
            .single();
          if (sErr) throw sErr;

          // Default installment: due 30 days from now
          const due = new Date();
          due.setDate(due.getDate() + 30);
          const dueDate = due.toISOString().split('T')[0];

          const { error: iErr } = await supabase.from('installments').insert({
            fee_structure_id: structData.id,
            name: 'Full Payment',
            amount: fee.amount,
            due_date: dueDate,
            display_order: 1,
          });
          if (iErr) throw iErr;
          result.feeStructuresCreated++;
        }
      } catch (e: unknown) {
        result.errors.push(`Fee "${fee.name}": ${(e as Error).message}`);
      }
    }
  }

  return result;
}

export const DEFAULT_CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8',
  'Class 9', 'Class 10',
  'Class 11', 'Class 12',
];

export const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export const DEFAULT_FEES: OnboardingFeeRow[] = [
  { name: 'Tuition Fee', amount: 30000, is_mandatory: true, enabled: true },
  { name: 'Transport Fee', amount: 6000, is_mandatory: false, enabled: false },
  { name: 'Activities Fee', amount: 3000, is_mandatory: false, enabled: false },
];

/** Default academic year name like "2025-26" based on current month (Apr cutoff). */
export function defaultYearName(today = new Date()): { name: string; start: string; end: string } {
  const month = today.getMonth(); // 0-indexed, Apr = 3
  const year = today.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  const name = `${startYear}-${String(endYear).slice(-2)}`;
  const start = `${startYear}-04-01`;
  const end = `${endYear}-03-31`;
  return { name, start, end };
}
