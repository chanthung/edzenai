

# Plan: AI-Powered Excel Import for Student Data

## Overview

Build a 3-step flow (Upload → Preview → Confirm) that sends an Excel file to an n8n webhook, which uses Gemini to parse/clean the data, then returns structured student records for preview and bulk import.

## Architecture

```text
Frontend (Modal)          Edge Function           n8n Workflow
┌──────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ 1. Upload    │───>│ process-excel    │───>│ Receive file (base64)│
│ 2. Preview   │<───│ (proxy to n8n)   │<───│ Extract → Gemini AI  │
│ 3. Confirm   │    └──────────────────┘    │ Clean & map columns  │
│    ↓         │                            │ Return JSON          │
│ Bulk insert  │                            └─────────────────────┘
└──────────────┘
```

## Step 1: Edge Function — `process-student-excel`

- Receives the uploaded file as base64 from the frontend
- Forwards it to an n8n webhook URL (new secret: `N8N_STUDENT_IMPORT_WEBHOOK_URL`)
- n8n workflow: extracts Excel → sends column headers + sample rows to Gemini → returns mapped/cleaned JSON
- Edge function returns the cleaned student array to the frontend

**Expected n8n response format:**
```json
{
  "students": [
    {
      "name": "Rahul Sharma",
      "roll_number": "2024001",
      "class_name": "5",
      "section": "A",
      "parent_name": "Vijay Sharma",
      "parent_phone": "9876543210",
      "parent_email": "",
      "guardian": "",
      "address": "..."
    }
  ],
  "warnings": ["Row 5: missing phone number"],
  "duplicates": [{ "row": 3, "reason": "Same phone as row 1" }]
}
```

## Step 2: New Secret

- `N8N_STUDENT_IMPORT_WEBHOOK_URL` — the n8n production webhook that handles Excel parsing via Gemini

## Step 3: Frontend Component — `BulkStudentUpload.tsx`

A dialog with 3 internal steps:

**Step 1 — Upload:**
- File picker accepting `.xlsx`, `.csv`
- Academic year selector (pre-selects active year)
- "Process" button → sends file to edge function

**Step 2 — Preview:**
- Table showing parsed students (scrollable, max 20 visible)
- Row highlighting: red for missing required fields (name, phone), yellow for duplicates
- Checkbox per row to include/exclude
- Inline edit capability for quick fixes
- Info banner showing counts: total / valid / issues

**Step 3 — Confirm & Import:**
- "Import X Students" button
- Chunked inserts (50 at a time) into `students` table + `student_enrollments`
- Progress bar during import
- Duplicate check against existing students (name + phone + class)
- Summary: imported / skipped / errors

## Step 4: Integration into Students Page

- Add "Import via Excel" button next to "Add Student" in the page header
- Uses the same `useCreateStudent` pattern but with direct batch inserts for performance

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/process-student-excel/index.ts` | New edge function — proxy file to n8n |
| `supabase/config.toml` | Add `[functions.process-student-excel]` |
| `src/components/admin/BulkStudentUpload.tsx` | New component — upload, preview, import flow |
| `src/pages/admin/Students.tsx` | Add "Import via Excel" button |
| New secret: `N8N_STUDENT_IMPORT_WEBHOOK_URL` | n8n webhook for Excel processing |

## n8n Workflow (User-Side Setup)

The user will need to create an n8n workflow that:
1. Receives POST with `{ fileBase64, fileName }` 
2. Decodes and parses the Excel/CSV
3. Sends headers + sample data to Gemini for column mapping
4. Applies the mapping, cleans data, detects duplicates
5. Returns the structured JSON response

This is configured outside Lovable on the user's n8n instance — we only need the webhook URL.

## Duplicate Handling

- AI-side: n8n/Gemini flags duplicates within the uploaded file
- Client-side: Before inserting, check against existing students in the school (match on `lower(name) + parent_phone + class_name`)
- Options per duplicate: Skip (default) or Create anyway

## No Database Changes Required

All inserts use existing `students` and `student_enrollments` tables.

