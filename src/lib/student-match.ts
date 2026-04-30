// Fuzzy student matching used by the Marks Import preview to map a raw
// "Student Name" / "Roll No" cell from a spreadsheet or scan to an actual
// student record in the selected class + section.

export interface MatchableStudent {
  id: string;
  name: string;
  roll_number: string | null;
  class_name: string | null;
  section: string | null;
}

export interface StudentMatchResult {
  studentId: string | null;
  confidence: "exact_roll" | "exact_name" | "fuzzy" | null;
  matchedName: string | null;
}

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter(Boolean));
}

function tokenSetRatio(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

export function matchStudent(
  rawName: string | null | undefined,
  rawRoll: string | null | undefined,
  pool: MatchableStudent[],
): StudentMatchResult {
  if (pool.length === 0) return { studentId: null, confidence: null, matchedName: null };

  // 1. Roll number exact (case-insensitive, ignoring leading zeros)
  if (rawRoll && String(rawRoll).trim()) {
    const r = String(rawRoll).trim().toLowerCase().replace(/^0+/, "");
    for (const s of pool) {
      if (!s.roll_number) continue;
      const sr = s.roll_number.trim().toLowerCase().replace(/^0+/, "");
      if (sr === r) return { studentId: s.id, confidence: "exact_roll", matchedName: s.name };
    }
  }

  if (!rawName || !rawName.trim()) return { studentId: null, confidence: null, matchedName: null };

  const target = norm(rawName);

  // 2. Exact name match
  for (const s of pool) {
    if (norm(s.name) === target) return { studentId: s.id, confidence: "exact_name", matchedName: s.name };
  }

  // 3. Fuzzy: token set ≥ 0.6 OR levenshtein ≤ 2 on full normalized string
  let best: { id: string; name: string; score: number } | null = null;
  for (const s of pool) {
    const candidate = norm(s.name);
    const ts = tokenSetRatio(target, candidate);
    const lev = levenshtein(target, candidate);
    const levRatio = 1 - lev / Math.max(target.length, candidate.length, 1);
    const score = Math.max(ts, levRatio);
    if (score >= 0.6 && (!best || score > best.score)) {
      best = { id: s.id, name: s.name, score };
    }
  }
  if (best) return { studentId: best.id, confidence: "fuzzy", matchedName: best.name };

  return { studentId: null, confidence: null, matchedName: null };
}
