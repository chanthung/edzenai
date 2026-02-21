/**
 * NEP 2020 Learning Stage Mapping
 * 5+3+3+4 structure as per National Education Policy 2020
 */

export type NepLearningStage = 'foundational' | 'preparatory' | 'middle' | 'secondary';

export const NEP_STAGES: Record<NepLearningStage, { label: string; grades: string; ages: string }> = {
  foundational: { label: 'Foundational', grades: 'Pre-school – Grade 2', ages: 'Ages 3-8' },
  preparatory: { label: 'Preparatory', grades: 'Grades 3-5', ages: 'Ages 8-11' },
  middle: { label: 'Middle', grades: 'Grades 6-8', ages: 'Ages 11-14' },
  secondary: { label: 'Secondary', grades: 'Grades 9-12', ages: 'Ages 14-18' },
};

/**
 * Derives the NEP learning stage from a class_name string.
 * Mirrors the database function `get_nep_stage`.
 */
export function getNepStage(className: string | null | undefined): NepLearningStage | null {
  if (!className) return null;

  const cleaned = className.toLowerCase().trim();

  // Handle pre-school / nursery / LKG / UKG
  if (['pre-school', 'preschool', 'nursery', 'lkg', 'ukg', 'kg', 'kindergarten', 'pre-primary'].includes(cleaned)) {
    return 'foundational';
  }

  // Extract numeric grade
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;

  const gradeNum = parseInt(match[1], 10);

  if (gradeNum <= 2) return 'foundational';
  if (gradeNum <= 5) return 'preparatory';
  if (gradeNum <= 8) return 'middle';
  if (gradeNum <= 12) return 'secondary';

  return null;
}

export function getNepStageLabel(className: string | null | undefined): string {
  const stage = getNepStage(className);
  return stage ? NEP_STAGES[stage].label : 'Unknown';
}
