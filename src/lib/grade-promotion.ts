/**
 * Maps a class name to the next promoted class.
 * Returns null for Class 12 / "Passed Out" (no further promotion).
 */
export function getNextClass(className: string | null): string | null {
  if (!className) return null;

  const cleaned = className.trim().toLowerCase();

  const promotionMap: Record<string, string> = {
    'nursery': 'LKG',
    'pre-school': 'LKG',
    'preschool': 'LKG',
    'pre-primary': 'LKG',
    'lkg': 'UKG',
    'ukg': 'Class 1',
    'kg': 'Class 1',
    'kindergarten': 'Class 1',
  };

  if (promotionMap[cleaned]) {
    return promotionMap[cleaned];
  }

  // Extract numeric grade: "Class 5", "Grade 5", "5th", "Std 5", etc.
  const match = cleaned.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 12) return null; // Passed out
    // Preserve original prefix format
    const prefix = className.replace(/\d+.*/, '').trim();
    return `${prefix || 'Class '}${num + 1}`;
  }

  return null;
}

/**
 * Returns a human-friendly label for students who can't be promoted.
 */
export function getPromotionStatus(className: string | null): 'promotable' | 'passed_out' | 'unknown' {
  if (!className) return 'unknown';
  const next = getNextClass(className);
  if (next === null) {
    const num = parseInt((className.match(/(\d+)/) ?? [])[1] ?? '', 10);
    return num >= 12 ? 'passed_out' : 'unknown';
  }
  return 'promotable';
}
