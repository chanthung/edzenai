// Subject name normalization shared by marks-import and other parsers.
// Source of truth = the school's `subjects` table. Aliases are only used
// as a fallback to suggest a match when a header doesn't string-equal one.

export const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ["math", "maths", "mathematic", "mathematics", "ganit", "गणित"],
  English: ["english", "eng", "english language", "language - english", "lang eng"],
  Hindi: ["hindi", "hin", "हिंदी"],
  Science: ["science", "sci", "general science", "gen science"],
  EVS: ["evs", "environmental studies", "env. studies", "env studies", "environmental science"],
  "Social Studies": ["social studies", "sst", "soc. studies", "soc studies", "social science"],
  "Social Science": ["social science"],
  Sanskrit: ["sanskrit", "sans"],
  "Computer Science": ["computer", "computer science", "cs", "comp sci", "computers", "ict"],
  Physics: ["physics", "phy"],
  Chemistry: ["chemistry", "chem"],
  Biology: ["biology", "bio"],
  History: ["history", "hist"],
  Geography: ["geography", "geo"],
  Economics: ["economics", "eco", "econ"],
  "Physical Education": ["pe", "p.e", "p.e.", "physical education", "phy edu", "sports"],
  Art: ["art", "drawing", "painting", "fine arts"],
  Music: ["music"],
};

export interface KnownSubject {
  id: string;
  name: string;
  code: string | null;
}

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Try to match a raw header / cell value against the school's actual subjects.
 * Returns matched subject id + confidence ('exact' | 'alias' | 'fuzzy' | null).
 */
export function matchSubject(
  raw: string,
  knownSubjects: KnownSubject[],
): { subjectId: string | null; confidence: "exact" | "alias" | "fuzzy" | null; matchedName: string | null } {
  if (!raw || knownSubjects.length === 0) return { subjectId: null, confidence: null, matchedName: null };
  const r = norm(raw);
  if (!r) return { subjectId: null, confidence: null, matchedName: null };

  // 1. Exact name or code match
  for (const s of knownSubjects) {
    if (norm(s.name) === r) return { subjectId: s.id, confidence: "exact", matchedName: s.name };
    if (s.code && norm(s.code) === r) return { subjectId: s.id, confidence: "exact", matchedName: s.name };
  }

  // 2. Alias resolution → canonical name → check if school has it
  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (aliases.some((a) => norm(a) === r)) {
      const found = knownSubjects.find((s) => norm(s.name) === norm(canonical));
      if (found) return { subjectId: found.id, confidence: "alias", matchedName: found.name };
    }
  }

  // 3. Fuzzy: substring containment on length ≥ 4
  if (r.length >= 4) {
    for (const s of knownSubjects) {
      const n = norm(s.name);
      if (n.includes(r) || r.includes(n)) {
        return { subjectId: s.id, confidence: "fuzzy", matchedName: s.name };
      }
    }
  }

  return { subjectId: null, confidence: null, matchedName: null };
}

/**
 * Detect whether a header string looks like a subject column (vs Name / Roll No / Total).
 * Used for wide-layout Excel detection.
 */
const NON_SUBJECT_HEADERS = new Set([
  "name", "student name", "student", "pupil", "pupil name", "full name",
  "roll no", "roll_no", "rollno", "roll number", "admission no", "adm no",
  "sr no", "sl no", "s no", "id", "student id",
  "class", "class name", "std", "standard", "grade", "section", "div",
  "total", "grand total", "percentage", "%", "percent", "grade",
  "rank", "remarks", "comments", "max", "max marks", "out of",
]);

export function looksLikeSubjectHeader(header: string, knownSubjects: KnownSubject[]): boolean {
  const n = norm(header);
  if (!n) return false;
  if (NON_SUBJECT_HEADERS.has(n)) return false;
  // If it matches a known subject (any confidence), it's a subject column.
  const m = matchSubject(header, knownSubjects);
  return m.subjectId !== null;
}
