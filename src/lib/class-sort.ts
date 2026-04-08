/**
 * Natural sort comparator for class names.
 * Handles "Class 1", "Class 10", "Nursery", "LKG", "UKG" etc.
 */

const PRE_PRIMARY_ORDER: Record<string, number> = {
  'nursery': -4,
  'pre-school': -4,
  'preschool': -4,
  'pre-primary': -4,
  'lkg': -3,
  'ukg': -2,
  'kg': -2,
  'kindergarten': -2,
};

function classOrderKey(name: string): number {
  const lower = name.trim().toLowerCase();
  if (PRE_PRIMARY_ORDER[lower] !== undefined) return PRE_PRIMARY_ORDER[lower];
  const match = lower.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

export function sortClassNames(classes: string[]): string[] {
  return [...classes].sort((a, b) => classOrderKey(a) - classOrderKey(b));
}

export function compareClassNames(a: string, b: string): number {
  return classOrderKey(a) - classOrderKey(b);
}
