// Pure rules for section-aware teaching assignments.
// A row with section = null is class-wide (all sections). A row with a section
// overrides the class-wide rows for that subject + section only.

export interface AssignmentRow {
  teacher_id: string;
  subject_id: string;
  class_name: string;
  section: string | null;
}

/** Trim + uppercase; blank becomes null (= all sections). */
export function normalizeSection(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().replace(/\s+/g, " ").toUpperCase();
  return s === "" ? null : s;
}

export interface ResolvedCoverage {
  class_name: string;
  section: string;
  subject_id: string;
  teacher_ids: string[];
  source: "class_wide" | "section_override";
  /** Set when an override replaced different class-wide teachers. */
  overrideChangedTeachers: boolean;
}

/** Designated teacher(s) per class-section-subject. Never substitutes. */
export function resolveDesignatedTeachers(
  rows: AssignmentRow[],
  sectionsByClass: Record<string, string[]>,
): ResolvedCoverage[] {
  const out: ResolvedCoverage[] = [];
  const keys = new Set(rows.map((r) => `${r.class_name}\u0000${r.subject_id}`));
  for (const key of keys) {
    const [class_name, subject_id] = key.split("\u0000");
    const related = rows.filter((r) => r.class_name === class_name && r.subject_id === subject_id);
    const classWide = uniq(related.filter((r) => normalizeSection(r.section) === null).map((r) => r.teacher_id));
    for (const section of sectionsByClass[class_name] ?? []) {
      const sec = normalizeSection(section)!;
      const overrides = uniq(related.filter((r) => normalizeSection(r.section) === sec).map((r) => r.teacher_id));
      if (overrides.length) {
        const changed = classWide.length > 0 && !sameSet(classWide, overrides);
        out.push({ class_name, section: sec, subject_id, teacher_ids: overrides, source: "section_override", overrideChangedTeachers: changed });
      } else if (classWide.length) {
        out.push({ class_name, section: sec, subject_id, teacher_ids: classWide, source: "class_wide", overrideChangedTeachers: false });
      }
    }
  }
  return out;
}

/** Same teacher + subject + class has both a class-wide and a section row. Reported, never deleted. */
export function findRedundantAssignments(rows: AssignmentRow[]): AssignmentRow[] {
  const wide = new Set(
    rows.filter((r) => normalizeSection(r.section) === null).map((r) => `${r.teacher_id}|${r.subject_id}|${r.class_name}`),
  );
  return rows.filter((r) => normalizeSection(r.section) !== null && wide.has(`${r.teacher_id}|${r.subject_id}|${r.class_name}`));
}

/** Rows the current (non section-aware) generator cannot honour. */
export function countSectionSpecific(rows: AssignmentRow[]): number {
  return rows.filter((r) => normalizeSection(r.section) !== null).length;
}

const NON_TEACHING = ["librarian", "office assistant", "accountant", "clerk", "peon", "driver", "security"];
/** Default for "Included in timetable". Unknown designations default to true (review, never auto-exclude). */
export function defaultIncludedInTimetable(designation: string | null | undefined, role?: string | null): boolean {
  if (role === "accountant") return false;
  const d = (designation ?? "").trim().toLowerCase();
  return !NON_TEACHING.includes(d);
}

/** "English: 6-A, 6-B" / "Hindi: 7 (all sections)" chip labels. */
export function formatAssignmentChip(className: string, section: string | null): string {
  const short = className.replace(/^Class\s+/i, "");
  const s = normalizeSection(section);
  return s ? `${short}-${s}` : `${short} (all sections)`;
}

function uniq(a: string[]) { return [...new Set(a)].sort(); }
function sameSet(a: string[], b: string[]) { return a.length === b.length && a.every((x, i) => x === b[i]); }
