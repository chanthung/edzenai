# Marks Import — Error Handling Upgrade

## What already exists (skipping)

- 3 input modes (Excel/CSV, Printed, Handwritten) via `process-marks-import` edge function
- Subject normalization with aliases (Maths → Mathematics, Hindi/हिंदी, etc.)
- Student fuzzy matching (roll → exact name → token+Levenshtein)
- OCR confidence per cell (high/medium/low) with handwritten always downgraded
- Preview table with editable rows, manual student/subject pickers, red border on blocking issues
- Staging-only flow — no DB write until user clicks "Confirm & Save"
- `import_logs` audit row written after save
- `useSaveMarks` upsert on `(student_id, assessment_id, subject_id)` — overwrite is the implicit default today

## What's missing — this is what we'll add

### 1. Marks validation against the assessment's real max

Today the preview only flags `marks_obtained > maxMarks` if a max column existed in the file. But every assessment+subject already has a true max (template total or legacy `max_marks`). We'll:

- Pass the resolved `assessmentMaxBySubject` map into the preview dialog (computed from `templateComponents` total, or `100` fallback)
- For each row, compare `marksObtained` vs that resolved max → flag `marks_exceed_assessment_max`
- Show a per-row "Suggested fix" hint (e.g. "Cap at 50?" with one-click apply)

### 2. Total / percentage cross-check (Excel wide layout)

When the spreadsheet has a `Total` or `Percentage` column we currently ignore, recompute the sum from subject cells and compare:

- If |reported − recomputed| > 1 → row gets a yellow "total mismatch" warning with the recomputed value as a suggestion (display-only, never auto-applied)

### 3. Confidence score (0-100) per row

Add a `confidenceScore` field computed in the edge function:

```
base = 100
- 30 if studentId is null
- 15 if studentMatchConfidence === 'fuzzy'
- 30 if subjectId is null
- 25 if ocrConfidence === 'low'
- 10 if ocrConfidence === 'medium'
- 20 if marks_exceed_assessment_max
- 10 if outlier (see #4)
```

Display it in the preview table next to the existing Status column.

### 4. Outlier detection (class distribution)

In the preview dialog (client-side), for each `(subjectId)` group:

- Compute mean + stddev of `marksObtained`
- Flag rows where `|x - mean| > 2.5 * stddev` and group has ≥ 5 rows
- Show as an amber "outlier" badge — never blocking, just informative

### 5. OCR character disambiguation hint

For OCR rows with `ocrConfidence !== 'high'`, when the parsed marks string contains ambiguous chars (e.g. raw token had `B`, `O`, `S`), surface a small "Looks like B/8?" suggestion in the row. Implementation: have the vision tool also return `raw_text` per cell, then a tiny client-side regex flags `[B8O0SZ5]` ambiguity.

### 6. Duplicate handling (existing marks)

Before save, query existing `student_marks` for `(assessment_id, subject_id, student_id)` of all preview rows. Group rows into:

- **New** — no existing row
- **Update** — existing row, value differs
- **Identical** — existing row, value matches (auto-skip)

Add a single radio control above the table:

- "Skip rows that already have marks" (default)
- "Overwrite existing marks"

(We deliberately do NOT offer "Keep both" — the unique constraint forbids it and the user requested it disabled.)

### 7. Impact summary card (above Confirm button)

```
✔ 24 new marks to create
✏ 3 existing marks to update
⏭ 5 identical rows skipped
⚠ 2 rows have warnings (still saved)
✗ 4 rows blocked — fix before save
```

Counts update live as the user edits rows or toggles the duplicate strategy.

### 8. Hard confirmation gate for OCR / handwritten

Today `Confirm & Save` is a single click. For `mode !== 'excel'`, add an inline checkbox the user must tick:

> "I have reviewed every row above and the marks are correct."

Button stays disabled until ticked. Excel mode keeps single-click.

### 9. AI analysis trigger gating

After successful save, the success screen currently just says "you can run AI analysis". Change it to:

- If average row confidence ≥ 70 AND zero `marks_exceed_assessment_max` → show **"Run AI analysis now"** button (calls existing `analyze-progress` edge function for that class)
- Otherwise show a muted note: *"Confidence too low for automatic analysis. Re-check the marks first."*

## Technical changes

| Layer | File | Change |
|---|---|---|
| Edge fn | `supabase/functions/process-marks-import/index.ts` | Add `confidenceScore` per row, return `rawText` per OCR cell, accept optional `assessmentMaxBySubject` to pre-flag overflows server-side |
| Hook | `src/hooks/progress/useMarksImport.ts` | Extend `PreviewRow` with `confidenceScore`, `suggestedFix`, `isOutlier`, `isDuplicate`, `existingValue`. Add `useExistingMarksLookup(assessmentId, rows)` |
| Dialog | `MarksImportDialog.tsx` | Pass `assessmentMaxBySubject` (built from `templateComponents` total in `MarksEntry`) into edge call + preview. Add post-save AI-analysis CTA. |
| Preview | `MarksImportPreview.tsx` | New columns: Confidence, Status (Clean/Warning/Error). Outlier / total-mismatch / ambiguous-char badges. Suggested-fix one-click apply. Duplicate strategy radio. Impact summary card. OCR confirmation checkbox. |
| Page | `src/pages/progress/MarksEntry.tsx` | Compute and pass per-subject max + assessmentId to dialog |
| Logs | (no migration needed) | `import_logs.issue_rows` already JSONB — store the full issue snapshot for audit |

No new tables, no schema migration. The existing `import_logs` row + the existing `student_marks` upsert handle persistence; everything new is computed in-memory and gated on explicit user confirmation.

## Out of scope (per "ignore those already implemented")

- Building a separate `raw_marks_import` staging table — the in-memory preview already serves as the staging layer and never writes to DB without confirmation. Adding a physical staging table would duplicate state without user benefit.
- New OCR engine — current Gemini Vision pipeline already handles printed + handwritten with confidence tiers.
- Subject alias dictionary — already in `_shared/subject-normalize.ts`.
