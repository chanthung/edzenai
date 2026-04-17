

## Plan: Multi-Sheet Class-wise Import

### Current Behavior
The `process-student-excel` edge function reads only `workbook.SheetNames[0]`. All other sheets are silently ignored. CSV files have only one sheet, so they're unaffected.

### Approach
Modify only the `parseSpreadsheet` function (and its return shape) inside the edge function to detect class-named sheets, parse each, auto-inject the class name from the sheet title, and merge rows. The downstream pipeline (rule + AI mapping, normalization, dedupe in client) needs **no changes** — it already handles `class_name` per row.

### Changes

**1. `supabase/functions/process-student-excel/index.ts` — `parseSpreadsheet`**
- Detect if workbook has any "class sheets" matching `/^(class|std|grade|standard)\b/i` (case-insensitive).
- **If yes** (multi-sheet mode):
  - Extract class number/label from each matching sheet name (e.g., "Class 1" → "Class 1", "Std 5" → "Class 5", "Grade 10" → "Class 10", "Nursery"/"LKG"/"UKG" supported as bonus).
  - Parse each class sheet, take its headers (per-sheet — first row), build row objects.
  - Inject/override `class_name` (and any header that was already present) so every row carries the sheet's class.
  - Merge headers across sheets (union) and concat all rows.
  - Track per-sheet counts and ignored sheet names → return as new fields in response.
- **If no class sheet pattern detected** → fall back to current single-sheet behavior (no breaking change).

**2. Response shape additions (backward compatible)**
- Add optional `sheetSummary: { sheetName, className, rowCount }[]` and `ignoredSheets: string[]` to the JSON returned.

**3. `src/components/admin/BulkStudentUpload.tsx` — display only**
- Capture `data.sheetSummary` and `data.ignoredSheets` in state.
- On the **preview** step, show a small info chip row: "Detected sheets: Class 1 (32), Class 2 (28), Class 3 (35) · Ignored: Razorpay, WhatsApp API".
- On the **done** summary, append the same class-wise breakdown.
- No changes to row processing, validation, or duplicate logic.

**4. Empty / edge cases**
- If a class sheet is empty → skipped silently, included in `sheetSummary` with `rowCount: 0`.
- If multi-sheet detected but **all** class sheets empty → return existing "File has no data rows" error.
- If no class-pattern sheets at all → single-sheet fallback (unchanged behavior).

### What stays unchanged
- Rule + AI column mapping
- Phone / DOB / class normalization
- Client-side duplicate detection, validation, and import flow
- CSV handling
- Edge function row cap (2000)

### Files Modified
- `supabase/functions/process-student-excel/index.ts` (parsing logic + response fields)
- `src/components/admin/BulkStudentUpload.tsx` (display sheet summary in preview + done screens)

