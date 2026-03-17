import type { TemplateComponent, TemplateGradeMapping } from '@/hooks/progress/useAssessmentTemplates';

export interface ComponentMarkInput {
  componentId: string;
  marksObtained: number;
}

export interface ComputedResult {
  total: number;
  maxTotal: number;
  percentage: number;
  grade: string | null;
}

/**
 * Compute total from raw component marks
 */
export function computeTotal(
  componentMarks: ComponentMarkInput[],
  components: TemplateComponent[]
): { total: number; maxTotal: number } {
  const componentMap = new Map(components.map(c => [c.id, c]));
  let total = 0;
  let maxTotal = 0;

  for (const cm of componentMarks) {
    const comp = componentMap.get(cm.componentId);
    if (comp) {
      total += cm.marksObtained;
      maxTotal += Number(comp.max_marks);
    }
  }

  return { total, maxTotal };
}

/**
 * Compute percentage from total and max
 */
export function computePercentage(total: number, maxTotal: number): number {
  if (maxTotal <= 0) return 0;
  return Math.round((total / maxTotal) * 10000) / 100; // 2 decimal places
}

/**
 * Lookup grade from percentage using template grade mappings
 */
export function computeGrade(
  percentage: number,
  gradeMappings: TemplateGradeMapping[]
): string | null {
  if (!gradeMappings || gradeMappings.length === 0) return null;

  // Sort by min_percentage descending to find the best match
  const sorted = [...gradeMappings].sort((a, b) => b.min_percentage - a.min_percentage);

  for (const mapping of sorted) {
    if (percentage >= mapping.min_percentage && percentage <= mapping.max_percentage) {
      return mapping.grade_label;
    }
  }

  return null;
}

/**
 * Full computation pipeline: component marks → total, percentage, grade
 */
export function computeStudentResult(
  componentMarks: ComponentMarkInput[],
  components: TemplateComponent[],
  gradeMappings: TemplateGradeMapping[]
): ComputedResult {
  const { total, maxTotal } = computeTotal(componentMarks, components);
  const percentage = computePercentage(total, maxTotal);
  const grade = computeGrade(percentage, gradeMappings);

  return { total, maxTotal, percentage, grade };
}
