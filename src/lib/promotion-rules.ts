// Smart Promotion Engine — board-aware rules + evaluator
// Used by Settings → Promotion Rules and Academic Years → Promotions tab.

export type Board = "CBSE" | "ICSE" | "State" | "Custom";
export type ClassRange = "1-8" | "9-10" | "11" | "12";

export interface PromotionRule {
  id?: string;
  school_id?: string;
  board: Board;
  class_range: ClassRange;
  min_subject_pct: number;
  min_theory_pct: number | null;
  min_practical_pct: number | null;
  min_internal_pct: number | null;
  english_compulsory: boolean;
  grace_marks: number;
  max_compartment_subjects: number;
  best_of_n: number | null;
  is_board_exit: boolean;
  attendance_threshold: number | null;
  custom_rules: { subject: string; min_pct: number }[];
}

export const CLASS_RANGES: { value: ClassRange; label: string }[] = [
  { value: "1-8", label: "Class 1 – 8 (School-defined)" },
  { value: "9-10", label: "Class 9 – 10 (Board)" },
  { value: "11", label: "Class 11" },
  { value: "12", label: "Class 12 (Board exit)" },
];

const base = (overrides: Partial<PromotionRule>): PromotionRule => ({
  board: "CBSE",
  class_range: "1-8",
  min_subject_pct: 35,
  min_theory_pct: null,
  min_practical_pct: null,
  min_internal_pct: null,
  english_compulsory: true,
  grace_marks: 0,
  max_compartment_subjects: 1,
  best_of_n: null,
  is_board_exit: false,
  attendance_threshold: null,
  custom_rules: [],
  ...overrides,
});

export const BOARD_DEFAULTS: Record<Board, Record<ClassRange, PromotionRule>> = {
  CBSE: {
    "1-8": base({ board: "CBSE", class_range: "1-8", min_subject_pct: 35, attendance_threshold: 75 }),
    "9-10": base({
      board: "CBSE", class_range: "9-10",
      min_subject_pct: 33, min_theory_pct: 33, min_internal_pct: 33,
      grace_marks: 1, max_compartment_subjects: 1,
    }),
    "11": base({
      board: "CBSE", class_range: "11",
      min_subject_pct: 33, min_theory_pct: 33, min_practical_pct: 33,
      max_compartment_subjects: 1,
    }),
    "12": base({
      board: "CBSE", class_range: "12",
      min_subject_pct: 33, min_theory_pct: 33, min_practical_pct: 33,
      is_board_exit: true,
    }),
  },
  ICSE: {
    "1-8": base({ board: "ICSE", class_range: "1-8", min_subject_pct: 35 }),
    "9-10": base({
      board: "ICSE", class_range: "9-10",
      min_subject_pct: 35, min_theory_pct: 35, min_internal_pct: 33,
      best_of_n: 5, max_compartment_subjects: 1,
    }),
    "11": base({
      board: "ICSE", class_range: "11",
      min_subject_pct: 33, min_theory_pct: 33, min_practical_pct: 33,
      max_compartment_subjects: 1,
    }),
    "12": base({
      board: "ICSE", class_range: "12",
      min_subject_pct: 33, min_theory_pct: 33, min_practical_pct: 33,
      is_board_exit: true,
    }),
  },
  State: {
    "1-8": base({ board: "State", class_range: "1-8", min_subject_pct: 35 }),
    "9-10": base({ board: "State", class_range: "9-10", min_subject_pct: 35, max_compartment_subjects: 1 }),
    "11": base({ board: "State", class_range: "11", min_subject_pct: 35, max_compartment_subjects: 1 }),
    "12": base({ board: "State", class_range: "12", min_subject_pct: 35, is_board_exit: true }),
  },
  Custom: {
    "1-8": base({ board: "Custom", class_range: "1-8" }),
    "9-10": base({ board: "Custom", class_range: "9-10" }),
    "11": base({ board: "Custom", class_range: "11" }),
    "12": base({ board: "Custom", class_range: "12" }),
  },
};

export function classNameToRange(className: string | null | undefined): ClassRange | null {
  if (!className) return null;
  const m = className.toLowerCase().match(/(\d+)/);
  if (!m) return "1-8"; // pre-school / nursery / LKG / UKG
  const n = parseInt(m[1], 10);
  if (n <= 8) return "1-8";
  if (n <= 10) return "9-10";
  if (n === 11) return "11";
  if (n === 12) return "12";
  return null;
}

export function resolveRule(
  rules: PromotionRule[] | undefined,
  board: Board,
  className: string | null | undefined,
): PromotionRule | null {
  const range = classNameToRange(className);
  if (!range) return null;
  const saved = rules?.find((r) => r.board === board && r.class_range === range);
  return saved ?? BOARD_DEFAULTS[board][range];
}

export type EvalStatus = "qualifies" | "review" | "not_qualifies";

export interface SubjectMark {
  subject: string;
  pct: number; // overall %
  theory_pct?: number | null;
  practical_pct?: number | null;
  internal_pct?: number | null;
}

export interface EvalResult {
  status: EvalStatus;
  reason: string;
  failingSubjects: string[];
  graceEligible: boolean;
  avgPct: number;
}

export function evaluateStudent(
  marks: SubjectMark[],
  rule: PromotionRule | null,
  hasMarks: boolean,
): EvalResult {
  if (!rule) {
    return { status: "review", reason: "No promotion rule configured", failingSubjects: [], graceEligible: false, avgPct: 0 };
  }
  if (rule.is_board_exit) {
    return { status: "not_qualifies", reason: "Board exit year — manage board results externally", failingSubjects: [], graceEligible: false, avgPct: 0 };
  }
  if (!hasMarks || marks.length === 0) {
    return { status: "review", reason: "Incomplete marks — manual review required", failingSubjects: [], graceEligible: false, avgPct: 0 };
  }

  const customMap = new Map(rule.custom_rules.map((c) => [c.subject.toLowerCase(), c.min_pct]));
  const failing: string[] = [];
  let graceEligible = false;

  for (const m of marks) {
    const customMin = customMap.get(m.subject.toLowerCase());
    const minPct = customMin ?? rule.min_subject_pct;
    let failed = m.pct < minPct;

    if (rule.min_theory_pct != null && m.theory_pct != null && m.theory_pct < rule.min_theory_pct) failed = true;
    if (rule.min_practical_pct != null && m.practical_pct != null && m.practical_pct < rule.min_practical_pct) failed = true;
    if (rule.min_internal_pct != null && m.internal_pct != null && m.internal_pct < rule.min_internal_pct) failed = true;

    if (failed) {
      // Grace-mark: within rule.grace_marks of pass
      const gap = minPct - m.pct;
      if (rule.grace_marks > 0 && gap > 0 && gap <= rule.grace_marks) {
        graceEligible = true;
      }
      failing.push(m.subject);
    }
  }

  // English compulsory rule
  if (rule.english_compulsory) {
    const eng = marks.find((m) => /english/i.test(m.subject));
    if (eng && eng.pct < rule.min_subject_pct && !failing.includes(eng.subject)) {
      failing.push(eng.subject);
    }
  }

  // Best-of-N (ICSE) — exclude lowest scorer from avg
  let avgPct: number;
  if (rule.best_of_n && marks.length > rule.best_of_n) {
    const sorted = [...marks].sort((a, b) => b.pct - a.pct).slice(0, rule.best_of_n);
    avgPct = sorted.reduce((s, m) => s + m.pct, 0) / sorted.length;
  } else {
    avgPct = marks.reduce((s, m) => s + m.pct, 0) / marks.length;
  }

  if (failing.length === 0) {
    return { status: "qualifies", reason: "Passes all subjects", failingSubjects: [], graceEligible: false, avgPct };
  }
  if (graceEligible && failing.length === 1) {
    return { status: "review", reason: "Grace-mark eligible (1 subject within grace)", failingSubjects: failing, graceEligible: true, avgPct };
  }
  if (failing.length <= rule.max_compartment_subjects) {
    return { status: "review", reason: `Compartment — failing ${failing.length} subject(s)`, failingSubjects: failing, graceEligible, avgPct };
  }
  return { status: "not_qualifies", reason: `Failing ${failing.length} subjects`, failingSubjects: failing, graceEligible, avgPct };
}
