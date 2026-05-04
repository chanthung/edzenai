// process-marks-import — parse Excel/CSV, printed marksheets (image/PDF),
// and handwritten marksheets into a normalized preview payload.
// NEVER writes to the database. Client confirms the preview, then saves
// using the existing useSaveMarks hook.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Subject normalization (inlined; mirrors _shared/subject-normalize.ts) ──

const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ["math", "maths", "mathematic", "mathematics", "ganit"],
  English: ["english", "eng", "english language", "language - english", "lang eng"],
  Hindi: ["hindi", "hin"],
  Science: ["science", "sci", "general science", "gen science"],
  EVS: ["evs", "environmental studies", "env studies", "environmental science"],
  "Social Studies": ["social studies", "sst", "soc studies", "social science"],
  Sanskrit: ["sanskrit", "sans"],
  "Computer Science": ["computer", "computer science", "cs", "comp sci", "computers", "ict"],
  Physics: ["physics", "phy"],
  Chemistry: ["chemistry", "chem"],
  Biology: ["biology", "bio"],
  History: ["history", "hist"],
  Geography: ["geography", "geo"],
  Economics: ["economics", "eco", "econ"],
  "Physical Education": ["pe", "physical education", "phy edu", "sports"],
  Art: ["art", "drawing", "painting", "fine arts"],
  Music: ["music"],
};

interface KnownSubject { id: string; name: string; code: string | null }

function n(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function matchSubject(raw: string, ks: KnownSubject[]) {
  if (!raw || ks.length === 0) return { subjectId: null as string | null, matchedName: null as string | null, confidence: null as string | null };
  const r = n(raw);
  if (!r) return { subjectId: null, matchedName: null, confidence: null };
  for (const s of ks) {
    if (n(s.name) === r) return { subjectId: s.id, matchedName: s.name, confidence: "exact" };
    if (s.code && n(s.code) === r) return { subjectId: s.id, matchedName: s.name, confidence: "exact" };
  }
  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (aliases.some((a) => n(a) === r)) {
      const found = ks.find((s) => n(s.name) === n(canonical));
      if (found) return { subjectId: found.id, matchedName: found.name, confidence: "alias" };
    }
  }
  if (r.length >= 4) {
    for (const s of ks) {
      const sn = n(s.name);
      if (sn.includes(r) || r.includes(sn)) return { subjectId: s.id, matchedName: s.name, confidence: "fuzzy" };
    }
  }
  return { subjectId: null, matchedName: null, confidence: null };
}

const NON_SUBJECT_HEADERS = new Set([
  "name", "student name", "student", "pupil", "pupil name", "full name",
  "roll no", "rollno", "roll number", "admission no", "adm no",
  "sr no", "sl no", "s no", "id", "student id",
  "class", "class name", "std", "standard", "grade", "section", "div",
  "total", "grand total", "percentage", "percent",
  "rank", "remarks", "comments", "max", "max marks", "out of",
]);

// ── Student matching ───────────────────────────────────────────────────

interface KnownStudent { id: string; name: string; roll_number: string | null; section?: string | null }

function tokenSetRatio(a: string, b: string): number {
  const A = new Set(n(a).split(" ").filter(Boolean));
  const B = new Set(n(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
}

function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
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

function matchStudent(rawName: string, rawRoll: string, pool: KnownStudent[], rawSection?: string) {
  const result = { studentId: null as string | null, matchedName: null as string | null, confidence: null as string | null, matchedSection: null as string | null };
  if (pool.length === 0) return result;

  // If the Excel has a section column, narrow pool first for better disambiguation
  let scopedPool = pool;
  if (rawSection && rawSection.trim()) {
    const sec = rawSection.trim().toUpperCase();
    const sectionFiltered = pool.filter(s => (s.section || "").trim().toUpperCase() === sec);
    if (sectionFiltered.length > 0) scopedPool = sectionFiltered;
  }

  if (rawRoll && rawRoll.trim()) {
    const r = rawRoll.trim().toLowerCase().replace(/^0+/, "");
    for (const s of scopedPool) {
      if (!s.roll_number) continue;
      if (s.roll_number.trim().toLowerCase().replace(/^0+/, "") === r) {
        return { studentId: s.id, matchedName: s.name, confidence: "exact_roll", matchedSection: s.section || null };
      }
    }
    // Fallback to full pool if scoped didn't match
    if (scopedPool !== pool) {
      for (const s of pool) {
        if (!s.roll_number) continue;
        if (s.roll_number.trim().toLowerCase().replace(/^0+/, "") === r) {
          return { studentId: s.id, matchedName: s.name, confidence: "exact_roll", matchedSection: s.section || null };
        }
      }
    }
  }
  if (!rawName || !rawName.trim()) return result;
  const target = n(rawName);
  for (const s of scopedPool) {
    if (n(s.name) === target) return { studentId: s.id, matchedName: s.name, confidence: "exact_name", matchedSection: s.section || null };
  }
  if (scopedPool !== pool) {
    for (const s of pool) {
      if (n(s.name) === target) return { studentId: s.id, matchedName: s.name, confidence: "exact_name", matchedSection: s.section || null };
    }
  }
  let best: { id: string; name: string; score: number; section: string | null } | null = null;
  for (const s of pool) {
    const candidate = n(s.name);
    const ts = tokenSetRatio(target, candidate);
    const l = lev(target, candidate);
    const lr = 1 - l / Math.max(target.length, candidate.length, 1);
    const score = Math.max(ts, lr);
    if (score >= 0.6 && (!best || score > best.score)) best = { id: s.id, name: s.name, score, section: s.section || null };
  }
  if (best) return { studentId: best.id, matchedName: best.name, confidence: "fuzzy", matchedSection: best.section };
  return result;
}

// ── Excel parsing ──────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseSpreadsheet(b64: string, fileName: string): { headers: string[]; rows: Record<string, string>[] } {
  const bytes = b64ToBytes(b64);
  if (fileName.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder("utf-8").decode(bytes);
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("File has no data rows");
    const splitRow = (line: string) => {
      const r: string[] = [];
      let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (ch === "," && !q) { r.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      r.push(cur.trim());
      return r;
    };
    const headers = splitRow(lines[0]);
    const rows = lines.slice(1).map((l) => {
      const v = splitRow(l);
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (v[i] || "").trim(); });
      return o;
    });
    return { headers, rows };
  }
  const wb = XLSX.read(bytes.buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  if (raw.length < 2) throw new Error("File has no data rows");
  const headers = (raw[0] as any[]).map((h) => String(h ?? "").trim()).filter(Boolean);
  const rows = (raw as any[][]).slice(1)
    .filter((r) => r.some((v) => v !== null && v !== undefined && String(v).trim() !== ""))
    .map((r) => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = String(r[i] ?? "").trim(); });
      return o;
    });
  return { headers, rows };
}

// ── Header role detection (which column = name / roll / subject) ──────

function findColumn(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    if (candidates.includes(n(h))) return h;
  }
  return null;
}

// ── Output row shape ───────────────────────────────────────────────────

interface PreviewRow {
  rowIndex: number;
  rawStudent: string;
  rawRoll: string;
  studentId: string | null;
  matchedStudentName: string | null;
  matchedSection: string | null;
  studentMatchConfidence: string | null;   // exact_roll | exact_name | fuzzy | null
  rawSubject: string;
  subjectId: string | null;
  matchedSubjectName: string | null;
  subjectMatchConfidence: string | null;   // exact | alias | fuzzy | null
  marksObtained: number | null;
  maxMarks: number | null;
  ocrConfidence?: "high" | "medium" | "low";
  rawText?: string;          // raw OCR token (for ambiguous-char hints)
  reportedTotal?: number | null;     // Excel: parsed Total/Percentage value if present
  recomputedTotal?: number | null;   // Excel: sum of subject cells for the same row
  issues: string[];
  confidenceScore: number;   // 0-100
}

// Compute a 0-100 confidence score for a row given its issues + assessment max.
function scoreRow(r: Omit<PreviewRow, "confidenceScore">, assessmentMax: number | null): number {
  let s = 100;
  if (!r.studentId) s -= 30;
  else if (r.studentMatchConfidence === "fuzzy") s -= 15;
  if (!r.subjectId) s -= 30;
  if (r.ocrConfidence === "low") s -= 25;
  else if (r.ocrConfidence === "medium") s -= 10;
  // marks vs assessment max
  if (assessmentMax != null && r.marksObtained != null && r.marksObtained > assessmentMax) s -= 20;
  // marks vs reported max in file
  if (r.maxMarks != null && r.marksObtained != null && r.marksObtained > r.maxMarks) s -= 20;
  // Total cross-check mismatch
  if (r.reportedTotal != null && r.recomputedTotal != null && Math.abs(r.reportedTotal - r.recomputedTotal) > 1) s -= 5;
  return Math.max(0, Math.min(100, s));
}

// ── Excel mode ─────────────────────────────────────────────────────────

function processExcel(
  b64: string,
  fileName: string,
  knownSubjects: KnownSubject[],
  knownStudents: KnownStudent[],
  assessmentMaxBySubject: Record<string, number>,
): { rows: PreviewRow[]; detectedHeaders: string[]; ignoredColumns: string[] } {
  const { headers, rows } = parseSpreadsheet(b64, fileName);

  const nameCol = findColumn(headers, ["name", "student name", "student", "full name", "pupil name", "pupil"]);
  const rollCol = findColumn(headers, ["roll no", "rollno", "roll number", "admission no", "adm no", "sr no", "sl no", "id", "student id"]);
  const sectionCol = findColumn(headers, ["section", "sec", "div", "division"]);

  // Long layout? Has explicit "subject" + "marks" columns
  const subjectCol = findColumn(headers, ["subject", "subject name"]);
  const marksCol = findColumn(headers, ["marks", "score", "marks obtained", "obtained"]);
  const maxCol = findColumn(headers, ["max", "max marks", "out of", "total marks"]);
  // Wide-layout total/percentage columns (used for cross-check, not import)
  const totalCol = findColumn(headers, ["total", "grand total"]);
  const pctCol = findColumn(headers, ["percentage", "percent", "%"]);

  const ignoredColumns: string[] = [];
  const out: PreviewRow[] = [];

  if (subjectCol && marksCol) {
    const usedHeaders = new Set([nameCol, rollCol, subjectCol, marksCol, maxCol].filter(Boolean) as string[]);
    headers.forEach((h) => { if (!usedHeaders.has(h)) ignoredColumns.push(h); });

    rows.forEach((row, idx) => {
      const rawStudent = nameCol ? row[nameCol] : "";
      const rawRoll = rollCol ? row[rollCol] : "";
      const rawSubject = row[subjectCol] || "";
      const marksRaw = row[marksCol];
      const maxRaw = maxCol ? row[maxCol] : "";

      const sm = matchStudent(rawStudent, rawRoll, knownStudents);
      const subm = matchSubject(rawSubject, knownSubjects);
      const marks = marksRaw === "" || marksRaw == null ? null : Number(marksRaw);
      const max = maxRaw === "" || maxRaw == null ? null : Number(maxRaw);
      const aMax = subm.subjectId ? assessmentMaxBySubject[subm.subjectId] ?? null : null;

      const issues: string[] = [];
      if (!sm.studentId) issues.push("unmatched_student");
      else if (sm.confidence === "fuzzy") issues.push("fuzzy_student");
      if (!subm.subjectId) issues.push("unmatched_subject");
      if (marks == null || isNaN(marks)) issues.push("invalid_marks");
      if (aMax != null && marks != null && !isNaN(marks) && marks > aMax) issues.push("marks_exceed_assessment_max");
      if (max != null && marks != null && !isNaN(marks) && marks > max) issues.push("marks_exceed_max");

      const base = {
        rowIndex: idx + 2,
        rawStudent, rawRoll,
        studentId: sm.studentId, matchedStudentName: sm.matchedName, studentMatchConfidence: sm.confidence,
        rawSubject,
        subjectId: subm.subjectId, matchedSubjectName: subm.matchedName, subjectMatchConfidence: subm.confidence,
        marksObtained: marks != null && !isNaN(marks) ? marks : null,
        maxMarks: max != null && !isNaN(max) ? max : null,
        issues,
      };
      out.push({ ...base, confidenceScore: scoreRow(base, aMax) });
    });
    return { rows: out, detectedHeaders: headers, ignoredColumns };
  }

  // WIDE LAYOUT
  const knownIdx = new Map<string, ReturnType<typeof matchSubject>>();
  const subjectColumns: string[] = [];
  for (const h of headers) {
    if ([nameCol, rollCol, totalCol, pctCol].includes(h)) continue;
    if (NON_SUBJECT_HEADERS.has(n(h))) { ignoredColumns.push(h); continue; }
    const m = matchSubject(h, knownSubjects);
    if (m.subjectId) { subjectColumns.push(h); knownIdx.set(h, m); }
    else ignoredColumns.push(h);
  }

  rows.forEach((row, idx) => {
    const rawStudent = nameCol ? row[nameCol] : "";
    const rawRoll = rollCol ? row[rollCol] : "";
    const sm = matchStudent(rawStudent, rawRoll, knownStudents);

    // Reported total + recomputed sum (for cross-check)
    const reportedRaw = totalCol && row[totalCol] !== "" && row[totalCol] != null ? Number(row[totalCol]) : null;
    const reportedTotal = reportedRaw != null && !isNaN(reportedRaw) ? reportedRaw : null;
    let sum = 0;
    let hasAny = false;
    for (const subjHeader of subjectColumns) {
      const v = Number(row[subjHeader]);
      if (!isNaN(v)) { sum += v; hasAny = true; }
    }
    const recomputed = hasAny ? sum : null;

    for (const subjHeader of subjectColumns) {
      const cell = row[subjHeader];
      if (cell === "" || cell == null) continue;
      const marks = Number(cell);
      const subm = knownIdx.get(subjHeader)!;
      const aMax = subm.subjectId ? assessmentMaxBySubject[subm.subjectId] ?? null : null;
      const issues: string[] = [];
      if (!sm.studentId) issues.push("unmatched_student");
      else if (sm.confidence === "fuzzy") issues.push("fuzzy_student");
      if (isNaN(marks)) issues.push("invalid_marks");
      if (aMax != null && !isNaN(marks) && marks > aMax) issues.push("marks_exceed_assessment_max");
      if (reportedTotal != null && recomputed != null && Math.abs(reportedTotal - recomputed) > 1) issues.push("total_mismatch");

      const base = {
        rowIndex: idx + 2,
        rawStudent, rawRoll,
        studentId: sm.studentId, matchedStudentName: sm.matchedName, studentMatchConfidence: sm.confidence,
        rawSubject: subjHeader,
        subjectId: subm.subjectId, matchedSubjectName: subm.matchedName, subjectMatchConfidence: subm.confidence,
        marksObtained: isNaN(marks) ? null : marks,
        maxMarks: null as number | null,
        reportedTotal,
        recomputedTotal: recomputed,
        issues,
      };
      out.push({ ...base, confidenceScore: scoreRow(base, aMax) });
    }
  });

  return { rows: out, detectedHeaders: headers, ignoredColumns };
}

// ── Vision mode (printed / handwritten) ────────────────────────────────

async function processVision(
  mode: "printed" | "handwritten",
  fileBase64: string,
  mimeType: string,
  knownSubjects: KnownSubject[],
  knownStudents: KnownStudent[],
  assessmentMaxBySubject: Record<string, number>,
  apiKey: string,
): Promise<{ rows: PreviewRow[]; detectedHeaders: string[]; ignoredColumns: string[] }> {
  if (!mimeType.startsWith("image/")) {
    throw new Error("PDF support coming soon. Please upload a JPG/PNG photo of the marksheet for now.");
  }

  const dataUrl = `data:${mimeType};base64,${fileBase64}`;
  const subjectsList = knownSubjects.map((s) => s.name).join(", ");
  const isHand = mode === "handwritten";

  const sys = `You extract marksheet data from a photo. The marksheet contains a table of students and their marks across subjects. ${
    isHand ? "The marks are HANDWRITTEN — be conservative with confidence (never 'high')." : "The marks are PRINTED."
  }

Known subjects in the school: ${subjectsList || "(unknown)"}.

Return one row per (student, subject, marks) cell using the provided tool. For each cell estimate confidence ('high' | 'medium' | 'low') AND return the raw_text exactly as you see it on the page (so we can flag character ambiguity like 8 vs B). Skip cells that are blank or unreadable. Do not invent data.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: isHand ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: [
          { type: "text", text: "Extract every (student, subject, marks) entry from this marksheet." },
          { type: "image_url", image_url: { url: dataUrl } },
        ] },
      ],
      tools: [{
        type: "function",
        function: {
          name: "return_marks",
          description: "Return parsed marksheet rows.",
          parameters: {
            type: "object",
            properties: {
              max_marks: { type: ["number", "null"], description: "Max marks per cell if shown on the sheet (e.g. /50). Null if absent." },
              entries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    student_name: { type: "string" },
                    roll_number: { type: ["string", "null"] },
                    subject: { type: "string" },
                    marks: { type: ["number", "null"] },
                    raw_text: { type: ["string", "null"], description: "Exact characters as printed/written in the cell." },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["student_name", "subject", "marks", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["entries"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "return_marks" } },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error:", resp.status, t);
    if (resp.status === 429) throw new Error("AI rate limit hit. Please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits to your Lovable workspace.");
    throw new Error("Could not read the marksheet image.");
  }

  const j = await resp.json();
  const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no structured data");
  let parsed: { entries: Array<{ student_name: string; roll_number: string | null; subject: string; marks: number | null; raw_text?: string | null; confidence: "high" | "medium" | "low" }>; max_marks: number | null };
  try { parsed = JSON.parse(args); } catch { throw new Error("AI returned bad JSON"); }

  const sharedMax = parsed.max_marks;
  const rows: PreviewRow[] = parsed.entries.map((e, idx) => {
    const sm = matchStudent(e.student_name, e.roll_number || "", knownStudents);
    const subm = matchSubject(e.subject, knownSubjects);
    let conf = e.confidence;
    if (isHand && conf === "high") conf = "medium";
    const aMax = subm.subjectId ? assessmentMaxBySubject[subm.subjectId] ?? null : null;

    const issues: string[] = [];
    if (!sm.studentId) issues.push("unmatched_student");
    else if (sm.confidence === "fuzzy") issues.push("fuzzy_student");
    if (!subm.subjectId) issues.push("unmatched_subject");
    if (e.marks == null || isNaN(e.marks)) issues.push("invalid_marks");
    if (conf === "low") issues.push("low_confidence");
    if (aMax != null && e.marks != null && !isNaN(e.marks) && e.marks > aMax) issues.push("marks_exceed_assessment_max");
    if (sharedMax != null && e.marks != null && !isNaN(e.marks) && e.marks > sharedMax) issues.push("marks_exceed_max");
    // Ambiguous-character hint (only for non-high OCR)
    if (conf !== "high" && e.raw_text && /[B8O0SZ5]/i.test(e.raw_text)) issues.push("ambiguous_chars");

    const base = {
      rowIndex: idx + 1,
      rawStudent: e.student_name,
      rawRoll: e.roll_number || "",
      studentId: sm.studentId, matchedStudentName: sm.matchedName, studentMatchConfidence: sm.confidence,
      rawSubject: e.subject,
      subjectId: subm.subjectId, matchedSubjectName: subm.matchedName, subjectMatchConfidence: subm.confidence,
      marksObtained: e.marks,
      maxMarks: sharedMax,
      ocrConfidence: conf as "high" | "medium" | "low",
      rawText: e.raw_text || undefined,
      issues,
    };
    return { ...base, confidenceScore: scoreRow(base, aMax) };
  });

  return { rows, detectedHeaders: ["student", "roll", "subject", "marks"], ignoredColumns: [] };
}

// ── Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      mode,
      fileBase64,
      fileName,
      mimeType,
      knownSubjects = [],
      knownStudents = [],
      assessmentMaxBySubject = {},
    }: {
      mode: "excel" | "printed" | "handwritten";
      fileBase64: string;
      fileName: string;
      mimeType?: string;
      knownSubjects: KnownSubject[];
      knownStudents: KnownStudent[];
      assessmentMaxBySubject?: Record<string, number>;
    } = body;

    if (!mode || !fileBase64) {
      return new Response(JSON.stringify({ error: "Missing mode or file" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;
    if (mode === "excel") {
      result = processExcel(fileBase64, fileName || "upload.xlsx", knownSubjects, knownStudents, assessmentMaxBySubject);
    } else if (mode === "printed" || mode === "handwritten") {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      result = await processVision(mode, fileBase64, mimeType || "image/jpeg", knownSubjects, knownStudents, assessmentMaxBySubject, apiKey);
    } else {
      return new Response(JSON.stringify({ error: "Unknown mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = {
      totalRows: result.rows.length,
      matchedStudents: result.rows.filter((r) => r.studentId && r.studentMatchConfidence !== "fuzzy").length,
      fuzzyStudents: result.rows.filter((r) => r.studentMatchConfidence === "fuzzy").length,
      unmatchedStudents: result.rows.filter((r) => !r.studentId).length,
      unmatchedSubjects: result.rows.filter((r) => !r.subjectId).length,
      lowConfidence: result.rows.filter((r) => r.ocrConfidence === "low").length,
      avgConfidence: result.rows.length
        ? Math.round(result.rows.reduce((a, r) => a + r.confidenceScore, 0) / result.rows.length)
        : 100,
      exceedsMax: result.rows.filter((r) => r.issues.includes("marks_exceed_assessment_max") || r.issues.includes("marks_exceed_max")).length,
    };

    return new Response(JSON.stringify({ ...result, summary, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-marks-import error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
