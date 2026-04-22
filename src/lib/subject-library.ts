/**
 * Local subject library powering the AI-Assisted Subject Creation flow.
 * No API call — pure lookup table.
 */

import type { SubjectType } from '@/hooks/progress/useSubjects';

export type Board = 'CBSE' | 'ICSE' | 'ISC' | 'STATE_BOARD';
export type ClassGroup = 'pre_primary' | 'primary' | 'middle' | 'secondary' | 'senior';
export type Stream = 'science' | 'commerce' | 'arts';

export interface SubjectSuggestion {
  name: string;
  code: string;
  type: SubjectType;
}

export const BOARD_LABELS: Record<Board, string> = {
  CBSE: 'CBSE',
  ICSE: 'ICSE',
  ISC: 'ISC',
  STATE_BOARD: 'State Board',
};

export const CLASS_GROUP_LABELS: Record<ClassGroup, string> = {
  pre_primary: 'Pre-Primary',
  primary: 'Primary',
  middle: 'Middle',
  secondary: 'Secondary',
  senior: 'Senior',
};

const PRE_PRIMARY_KEYS = new Set([
  'nursery', 'pre-school', 'preschool', 'pre-primary', 'lkg', 'ukg', 'kg', 'kindergarten',
]);

/** Map a class name like "Class 5", "Nursery", "LKG" to its group. */
export function classifyClass(className: string): ClassGroup | null {
  const lower = className.trim().toLowerCase();
  if (PRE_PRIMARY_KEYS.has(lower)) return 'pre_primary';
  const m = lower.match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n >= 1 && n <= 5) return 'primary';
  if (n >= 6 && n <= 8) return 'middle';
  if (n >= 9 && n <= 10) return 'secondary';
  if (n >= 11 && n <= 12) return 'senior';
  return null;
}

export function isSeniorClass(className: string): boolean {
  return classifyClass(className) === 'senior';
}

/** Generate a 2-6 char uppercase code from a subject name. */
export function generateSubjectCode(name: string): string {
  const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  if (!cleaned) return '';
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    // Acronym from first letter of each word
    const acronym = words.map(w => w[0]).join('').slice(0, 6);
    if (acronym.length >= 2) return acronym;
  }

  const single = words[0] || cleaned;
  if (single.length <= 6) return single;
  // Strip vowels (keep first char) to compress
  const compressed = single[0] + single.slice(1).replace(/[AEIOU]/g, '');
  return (compressed.length >= 2 ? compressed : single).slice(0, 6);
}

const COMMON_PRE_PRIMARY: SubjectSuggestion[] = [
  { name: 'English', code: 'ENG', type: 'academic' },
  { name: 'Hindi', code: 'HIN', type: 'academic' },
  { name: 'Numbers', code: 'NUM', type: 'academic' },
  { name: 'EVS', code: 'EVS', type: 'academic' },
  { name: 'Rhymes', code: 'RHY', type: 'co_curricular' },
  { name: 'Art & Craft', code: 'ART', type: 'co_curricular' },
];

const COMMON_PRIMARY: SubjectSuggestion[] = [
  { name: 'English', code: 'ENG', type: 'academic' },
  { name: 'Hindi', code: 'HIN', type: 'academic' },
  { name: 'Mathematics', code: 'MATH', type: 'academic' },
  { name: 'EVS', code: 'EVS', type: 'academic' },
  { name: 'Computer', code: 'COMP', type: 'academic' },
  { name: 'General Knowledge', code: 'GK', type: 'academic' },
  { name: 'Art & Craft', code: 'ART', type: 'co_curricular' },
  { name: 'Physical Education', code: 'PE', type: 'co_curricular' },
];

const COMMON_MIDDLE: SubjectSuggestion[] = [
  { name: 'English', code: 'ENG', type: 'academic' },
  { name: 'Hindi', code: 'HIN', type: 'academic' },
  { name: 'Mathematics', code: 'MATH', type: 'academic' },
  { name: 'Science', code: 'SCI', type: 'academic' },
  { name: 'Sanskrit', code: 'SAN', type: 'academic' },
  { name: 'Computer', code: 'COMP', type: 'academic' },
  { name: 'Physical Education', code: 'PE', type: 'co_curricular' },
];

export const SUBJECT_LIBRARY: Record<Board, Record<ClassGroup, SubjectSuggestion[]>> = {
  CBSE: {
    pre_primary: COMMON_PRE_PRIMARY,
    primary: COMMON_PRIMARY,
    middle: [
      ...COMMON_MIDDLE,
      { name: 'Social Science', code: 'SST', type: 'academic' },
    ],
    secondary: [
      { name: 'English', code: 'ENG', type: 'academic' },
      { name: 'Hindi', code: 'HIN', type: 'academic' },
      { name: 'Mathematics', code: 'MATH', type: 'academic' },
      { name: 'Science', code: 'SCI', type: 'academic' },
      { name: 'Social Science', code: 'SST', type: 'academic' },
      { name: 'Information Technology', code: 'IT', type: 'vocational' },
      { name: 'Physical Education', code: 'PE', type: 'co_curricular' },
    ],
    senior: [
      { name: 'English Core', code: 'ENG', type: 'academic' },
    ],
  },
  ICSE: {
    pre_primary: COMMON_PRE_PRIMARY,
    primary: COMMON_PRIMARY,
    middle: [
      ...COMMON_MIDDLE,
      { name: 'History & Civics', code: 'HC', type: 'academic' },
      { name: 'Geography', code: 'GEO', type: 'academic' },
    ],
    secondary: [
      { name: 'English', code: 'ENG', type: 'academic' },
      { name: 'Hindi', code: 'HIN', type: 'academic' },
      { name: 'Mathematics', code: 'MATH', type: 'academic' },
      { name: 'Physics', code: 'PHY', type: 'academic' },
      { name: 'Chemistry', code: 'CHEM', type: 'academic' },
      { name: 'Biology', code: 'BIO', type: 'academic' },
      { name: 'History & Civics', code: 'HC', type: 'academic' },
      { name: 'Geography', code: 'GEO', type: 'academic' },
      { name: 'Computer Applications', code: 'CA', type: 'academic' },
      { name: 'Physical Education', code: 'PE', type: 'co_curricular' },
    ],
    senior: [
      { name: 'English', code: 'ENG', type: 'academic' },
    ],
  },
  ISC: {
    pre_primary: COMMON_PRE_PRIMARY,
    primary: COMMON_PRIMARY,
    middle: [
      ...COMMON_MIDDLE,
      { name: 'History & Civics', code: 'HC', type: 'academic' },
      { name: 'Geography', code: 'GEO', type: 'academic' },
    ],
    secondary: [
      { name: 'English', code: 'ENG', type: 'academic' },
      { name: 'Mathematics', code: 'MATH', type: 'academic' },
      { name: 'Physics', code: 'PHY', type: 'academic' },
      { name: 'Chemistry', code: 'CHEM', type: 'academic' },
      { name: 'Biology', code: 'BIO', type: 'academic' },
      { name: 'History & Civics', code: 'HC', type: 'academic' },
      { name: 'Geography', code: 'GEO', type: 'academic' },
      { name: 'Computer Applications', code: 'CA', type: 'academic' },
    ],
    senior: [
      { name: 'English', code: 'ENG', type: 'academic' },
    ],
  },
  STATE_BOARD: {
    pre_primary: COMMON_PRE_PRIMARY,
    primary: [
      ...COMMON_PRIMARY,
      { name: 'Regional Language', code: 'REG', type: 'academic' },
    ],
    middle: [
      ...COMMON_MIDDLE,
      { name: 'Social Studies', code: 'SST', type: 'academic' },
      { name: 'Regional Language', code: 'REG', type: 'academic' },
    ],
    secondary: [
      { name: 'English', code: 'ENG', type: 'academic' },
      { name: 'Hindi', code: 'HIN', type: 'academic' },
      { name: 'Regional Language', code: 'REG', type: 'academic' },
      { name: 'Mathematics', code: 'MATH', type: 'academic' },
      { name: 'Science', code: 'SCI', type: 'academic' },
      { name: 'Social Studies', code: 'SST', type: 'academic' },
      { name: 'Physical Education', code: 'PE', type: 'co_curricular' },
    ],
    senior: [
      { name: 'English', code: 'ENG', type: 'academic' },
    ],
  },
};

export const SENIOR_STREAMS: Record<Stream, SubjectSuggestion[]> = {
  science: [
    { name: 'Physics', code: 'PHY', type: 'academic' },
    { name: 'Chemistry', code: 'CHEM', type: 'academic' },
    { name: 'Mathematics', code: 'MATH', type: 'academic' },
    { name: 'Biology', code: 'BIO', type: 'academic' },
    { name: 'Computer Science', code: 'CS', type: 'academic' },
  ],
  commerce: [
    { name: 'Accountancy', code: 'ACC', type: 'academic' },
    { name: 'Business Studies', code: 'BST', type: 'academic' },
    { name: 'Economics', code: 'ECO', type: 'academic' },
    { name: 'Mathematics', code: 'MATH', type: 'academic' },
    { name: 'Informatics Practices', code: 'IP', type: 'academic' },
  ],
  arts: [
    { name: 'History', code: 'HIST', type: 'academic' },
    { name: 'Political Science', code: 'POL', type: 'academic' },
    { name: 'Geography', code: 'GEO', type: 'academic' },
    { name: 'Psychology', code: 'PSY', type: 'academic' },
    { name: 'Sociology', code: 'SOC', type: 'academic' },
    { name: 'Economics', code: 'ECO', type: 'academic' },
  ],
};

/** Detect board hint from a string (e.g. assessment template name). */
export function detectBoardFromText(text: string | null | undefined): Board | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  if (upper.includes('ICSE')) return 'ICSE';
  if (upper.includes('ISC')) return 'ISC';
  if (upper.includes('CBSE')) return 'CBSE';
  if (upper.includes('STATE')) return 'STATE_BOARD';
  return null;
}

/** Get unique suggestions for given board + selected class groups (+ optional senior stream). */
export function getSuggestions(
  board: Board,
  groups: ClassGroup[],
  stream?: Stream | null,
): SubjectSuggestion[] {
  const seen = new Set<string>();
  const out: SubjectSuggestion[] = [];
  const push = (s: SubjectSuggestion) => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };
  for (const g of groups) {
    for (const s of SUBJECT_LIBRARY[board][g] || []) push(s);
  }
  if (groups.includes('senior') && stream) {
    for (const s of SENIOR_STREAMS[stream]) push(s);
  }
  return out;
}
