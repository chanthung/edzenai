## Analysis of the request

Your prompt covers a lot. Here is an honest read on each part before we build:


| Your ask                                      | Verdict                                         | Reasoning                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Excel upload + AI column mapping           | **Strongly recommended**                        | You already have this exact pattern working for students (`process-student-excel` — rule-based map + Gemini fallback + preview). Mirroring it for marks is fast, reliable, and consistent UX.                                                                                                                                                              |
| 2. Printed marksheet (PDF/image) OCR          | **Recommended**                                 | Gemini 2.5 Flash already does vision OCR in your codebase (`ocr-payment-proof`). It can return a structured table from a clear photo of a marksheet.                                                                                                                                                                                                       |
| 3. Handwritten scan (assistive)               | **Recommended but with realistic expectations** | Same vision model. Handwriting accuracy is 60–85% in good lighting — that's why your "low-confidence highlight + manual correction" requirement is the right design. We will not auto-save these. Open to Edit by Admins/teachers later for correction                                                                                                     |
| 4. Staging table                              | **Yes, but lightweight**                        | A staging table that survives a page reload would be over-engineering. The existing student importer keeps staged rows in client state until confirmed, then writes once. We'll do the same for marks. We *will* add an `import_logs`-style row per import for auditability (matches what students already have).                                          |
| 5. Subject normalization layer                | **Yes**                                         | "Maths/Math/Mathematics", "EVS/Environmental Studies", "SST/Social Studies" etc. — needed regardless of input mode.                                                                                                                                                                                                                                        |
| 6. UI: Import button + method modal + preview | **Yes**                                         | Fits the existing Marks Entry page perfectly.                                                                                                                                                                                                                                                                                                              |
| 7. Save → trigger AI analysis                 | **Defer**                                       | AI analysis already runs on demand in Progress Dashboard via `useAIAnalysis`. Auto-firing it on every import would burn AI credits. We'll add a "Run AI Analysis" CTA on the post-import success screen instead. * Some schools may be depending on Excel sheets for marks entry and still want to use the AI feature for Student/Class progress analysis. |


**One important correction to the spec:** "Match students using name + class" alone is fragile (duplicate names, transliteration, "Aman" vs "Aman Kumar"). We'll match on **roll number first, then name+class+section** as a fallback, and any unmatched rows go into the preview as "needs manual student selection" — never silently dropped.

## Scope (this plan)

We're adding a **Marks Import system to `Student Progress > Marks Entry**` — not changing the existing manual entry flow. After Year + Class + Section + Assessment are selected, an "Import Marks" button appears. The Subject selector becomes optional in import mode because the Excel/scan can carry multiple subjects at once.

## How it will work (user flow)

```text
Marks Entry page
├─ Select Year, Class, Section, Assessment (existing flow)
├─ [Manual Entry] (existing)              [Import Marks] ← NEW
│
└─ Import Marks → Method modal
   ├─ Excel / CSV
   ├─ Printed marksheet (PDF or photo)
   └─ Handwritten marksheet (assistive)
        │
        ▼
   Upload + parse (edge function)
        │
        ▼
   Preview table:
   - Rows: each parsed (Student × Subject) row
   - Inline edit on every cell
   - Match status badge: ✓ matched / ⚠ fuzzy / ✗ unmatched (dropdown picker)
   - Subject mapping: detected → system subject (dropdown if uncertain)
   - Confidence column (only for OCR/handwritten): green ≥0.85, amber 0.6–0.85, red <0.6
   - Validation: marks must be ≤ max for selected assessment template
   - "Confirm & Save" disabled until all unmatched/invalid rows are resolved
        │
        ▼
   Save (uses existing useSaveMarks → upserts student_marks
        + component_marks if a template is assigned)
        │
        ▼
   Success screen:
   - "Imported X marks across Y students, Z subjects"
   - [Run AI Analysis] CTA (optional, doesn't auto-fire)
   - [View Import History] link
```

## Technical design

### 1. New edge function: `process-marks-import`

Single endpoint, three modes (`excel` | `printed` | `handwritten`). Returns a normalized preview payload — never writes to DB.

```text
POST /functions/v1/process-marks-import
Body: { mode, fileBase64, fileName, mimeType,
        context: { schoolId, classId, sectionId, assessmentId, knownSubjects[], knownStudents[] } }

Response: {
  rows: [{
    rowIndex, rawStudentName, matchedStudentId|null, matchConfidence,
    rawSubject, matchedSubjectId|null,
    marksObtained, maxMarks, confidence,    // confidence only for OCR modes
    issues: ["unmatched_student", "subject_ambiguous", ...]
  }],
  ignoredColumns: [], detectedHeaders: [],
  summary: { totalRows, matched, unmatched, lowConfidence }
}
```

- **Excel/CSV**: reuse `xlsx` parsing pattern from `process-student-excel`. Hybrid mapping — rule dictionary for common headers (`Name`, `Roll No`, subject names, `Marks`, `Total`, `MM`) then Gemini for anything left. Two layouts supported:
  - **Wide**: one row per student, one column per subject (most common).
  - **Long**: `Student | Subject | Marks` rows.
- **Printed PDF/image**: Gemini 2.5 Pro vision (better than Flash for tables) with structured tool-call output → `{ headers, rows, perCellConfidence }`.
- **Handwritten**: same model, but we force `low|medium|high` confidence per cell and never set `confidence: high` for handwriting.

### 2. Subject normalization layer

`supabase/functions/_shared/subject-normalize.ts`:

```ts
const SUBJECT_ALIASES: Record<string, string[]> = {
  Mathematics: ["math", "maths", "mathematic"],
  English:    ["eng", "english language", "language - english"],
  Hindi:      ["hin", "हिंदी"],
  Science:    ["sci", "general science"],
  EVS:        ["evs", "environmental studies", "env. studies"],
  "Social Studies": ["sst", "soc. studies", "social science"],
  // …
};
// Match against the school's actual subjects table first;
// only suggest from aliases when no exact match found.
```

### 3. Student matching

In order of preference:

1. Exact `roll_number` match within selected class+section
2. Exact normalized name match (lowercase, collapsed whitespace) within class+section
3. Fuzzy name match (Levenshtein ≤2 OR token-set ratio ≥0.85) → marked as `match_confidence: medium`, requires user confirmation
4. No match → user must pick from dropdown in preview

### 4. Preview UI

New component tree under `src/components/progress/marks-import/`:

- `MarksImportButton.tsx` — button shown on Marks Entry page
- `MarksImportMethodDialog.tsx` — three-card method picker
- `MarksImportUploader.tsx` — file picker, calls edge function, shows progress
- `MarksImportPreview.tsx` — editable table with student/subject pickers, confidence badges, validation
- `MarksImportSuccess.tsx` — summary + "Run AI Analysis" CTA

Hook: `src/hooks/progress/useMarksImport.ts` (handles edge function call + final save via existing `useSaveMarks`).

### 5. Import history (audit)

Reuse the existing `import_logs` table — add `import_type` column (`students` | `marks`) via a small migration. Each import row stores: file name, mode, total/matched/saved counts, low-confidence count, issue rows JSON. Surfaces in a small `MarksImportHistoryCard` on the Marks Entry page.

### 6. Safety guarantees (matching your spec)

- **No DB writes without preview confirmation** — edge function only parses; save is a separate client-side action.
- **No silent drops** — every parsed row appears in the preview, even invalid ones.
- **Per-cell validation** before save (marks ≤ max, numeric, ≥0) — same rules as manual entry.
- **Atomic save**: uses existing `useSaveMarks` upsert (already idempotent on `student_id+assessment_id+subject_id`), so re-running an import is safe.

## Files to create / change

**New:**

- `supabase/functions/process-marks-import/index.ts`
- `supabase/functions/_shared/subject-normalize.ts`
- `src/hooks/progress/useMarksImport.ts`
- `src/components/progress/marks-import/MarksImportButton.tsx`
- `src/components/progress/marks-import/MarksImportMethodDialog.tsx`
- `src/components/progress/marks-import/MarksImportUploader.tsx`
- `src/components/progress/marks-import/MarksImportPreview.tsx`
- `src/components/progress/marks-import/MarksImportSuccess.tsx`
- `src/components/progress/marks-import/MarksImportHistoryCard.tsx`
- `src/lib/student-match.ts` (fuzzy match helper, reusable)

**Edit:**

- `src/pages/progress/MarksEntry.tsx` — wire in the import button + dialogs, allow subject to be optional in import mode
- `supabase/config.toml` — register new edge function (no `verify_jwt` override needed; Lovable default is fine)

**Migration (one small one):**

- `import_logs.import_type text not null default 'students'` — adds type discriminator, no breakage to existing rows

## Out of scope (deliberate)

- **Auto-trigger AI analysis on import** — costs credits, user can run manually from Progress Dashboard.
- **Persistent staging table** — client-side preview is sufficient; staging in DB adds complexity without clear UX win for a single-session import.
- **Bulk editing across imports** — one import session at a time.
- **Mobile camera capture** — file upload covers it; native camera flow can be a follow-up.

## Expected outcome

- Teachers can paste a class's worth of marks from Excel in ~30 seconds instead of typing 30 cells.
- Printed marksheets from a phone photo work in 1 upload + a quick correction pass.
- Handwritten scans work as an assistive shortcut, not a replacement for review.
- Zero risk of bad data: nothing saves without explicit "Confirm & Save".