
User wants to enhance multi-sheet import to also extract section from sheet names like "Class 5 A", "Std 3-B", "Grade 2 C".

Current state: `extractClassFromSheetName` only extracts class number. `class_name` is injected per row, but section is not.

Approach: add `extractSectionFromSheetName` and inject into each row only if the row doesn't already have a section value (so explicit Excel section column wins).

Edge cases:
- "Class 5" (no section) → don't inject; let downstream `normalizeSection` default to "A"
- "Class 10A" (no separator) → trailing letter = section
- "Nursery", "LKG" → no section letter; skip injection
- Avoid matching letters inside words like "Class" or "Std" — only match a single trailing letter after a digit/separator

## Plan: Auto-detect Section from Sheet Name

### Change (single file)
`supabase/functions/process-student-excel/index.ts`

**1. Add `extractSectionFromSheetName(name)`**
- Regex: match a single trailing letter (A-Z) that follows a digit, optionally separated by space/dash/underscore. Examples:
  - `"Class 5 A"` → `A`
  - `"Std 3-B"` → `B`
  - `"Grade 2_C"` → `C`
  - `"Class 10A"` → `A`
  - `"Class 5"` → `null`
  - `"Nursery"` / `"LKG"` → `null`
- Returns uppercase letter or `null`.

**2. Update multi-sheet loop in `parseSpreadsheet`**
- Compute `section = extractSectionFromSheetName(sheetName)` once per sheet.
- For each row: only set `r.section = section` if `section` is non-null AND the row has no existing non-empty section value (Excel column wins).

**3. Update `sheetSummary` (optional, nice-to-have)**
- Include `section` in each summary entry so the UI breakdown can show "Class 5 A (32)" instead of just "Class 5 (32)".

**4. Frontend display (`src/components/admin/BulkStudentUpload.tsx`)**
- If `summary.section` present, render `${className} ${section}` in the preview/done chips. Falls back to current behavior when section absent.

### What stays unchanged
- Rule + AI column mapping
- `normalizeSection` (still defaults blank → "A")
- Single-sheet fallback path
- All client-side validation, dedupe, and import flow

### Files Modified
- `supabase/functions/process-student-excel/index.ts`
- `src/components/admin/BulkStudentUpload.tsx`
