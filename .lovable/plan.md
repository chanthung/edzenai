
# Multi-Section Marks Import (Auto-Detect)

## Problem
When importing marks from an Excel file that contains students from sections A, B, and C, only students from the currently selected section are matched. Students from other sections appear as "unmatched" and their marks are lost, forcing repeated imports per section.

## Solution
Pass all students of the selected **class** (all sections) to the import dialog and edge function. The system auto-detects which sections are represented in the uploaded file and imports marks for all matched students in one pass.

## Changes

### 1. MarksEntry.tsx -- Pass all class students to the import dialog
Change line 673 from `filteredStudents` (section-filtered) to all students for the selected class. Add a new `classStudents` memo that filters only by `selectedClass` (not section).

### 2. KnownStudent type -- Add section field
Add an optional `section` field to `KnownStudent` in `useMarksImport.ts` so the preview can show which section each matched student belongs to. The edge function will also receive and return this info.

### 3. Edge function `process-marks-import` -- Pass through section info
Update the `KnownStudent` interface in the edge function to include `section`. When matching students, include the section in the response so the client can display a per-section summary. Also detect if the Excel itself has a "Section" column and use it to improve matching accuracy (e.g., two students with the same name in different sections).

### 4. MarksImportPreview -- Show section breakdown
Add a small summary badge/chip area at the top of the preview showing how many rows were matched per section (e.g., "Section A: 12 | Section B: 10 | Section C: 8"). This gives the admin confidence that all sections were detected.

### 5. MarksImportDialog success step -- Show section summary
Update the success message to show "Imported X marks across sections A, B, C" instead of just the count.

## What stays the same
- The section selector on the main MarksEntry page still works as before for manual marks entry
- The edge function still never writes to the database
- The save flow is unchanged -- the client confirms, then `useSaveMarks` upserts
- Backward compatible: single-section files still work fine
