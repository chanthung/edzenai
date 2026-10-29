# Unified Teacher Import, Section-Aware Assignments and Timetable Readiness

The brief covers 9 phases. This plan delivers them in three approval-gated stages so nothing live is changed without review.

## What is already confirmed (inspection summary)

1. Teacher import: `src/lib/teacher-import.ts` (shared parser/validation) feeds `TeacherImportDialog` and the `import-teacher-hr` function. It saves HR fields only and never creates assignments or logins.
2. Assignments are stored in `teacher_subject_assignments` (teacher, subject, class_name, academic_year_id, school_id). Class sections are in `teacher_class_assignments`.
3. There is **no section column** on subject assignments, so every assignment today is class-wide. "English, Class 2" cannot be limited to 2-A.
4. Edit Teacher uses `TeachingAssignmentsMatrix` with year-scoped, mandatory assignments.
5. Classes are normalised to "Class X" by a database rule; subjects are matched by ID; there is no subject alias list.
6. Source of truth: `teacher_subject_assignments`, scoped by school and academic year, protected by existing access rules.
7. The timetable connection returns assignments with `class_name` only (no section, no class-wide flag).
8. The Python adapter is on your computer and has not been seen, so how it expands class-wide assignments to sections is unverified.
9. Subject requirements are per section with draft/active status; all 72 Cherry rows are draft placeholders. Saved runs are always marked "solved", with no record of unplaced lessons.
10. The displayed Cherry timetable was saved before the new assignments, which is why Class 2's new teachers don't appear. A new generation is needed after the data is ready.

## Stage 1 — Section-aware assignments and Edit Teacher (this approval)

- Add one optional `section` field to `teacher_subject_assignments`. Empty means "all sections" (all current rows stay exactly as they are). Replace the uniqueness rule so a class-wide row and section rows can coexist without duplicates. Multiple teachers per section stay allowed.
- Edit Teacher: show compact chips ("English: 6-A, 6-B", "Hindi: 7 (all sections)") and let admins choose all sections or specific ones.
- Shared pure helper that resolves the designated teacher(s) for each class-section-subject: section rows override class-wide rows for that section only.
- Timetable connection: add `section` to each assignment and a new resolved list of designated teachers per class-section-subject. Existing fields stay unchanged so your current Python script keeps working.
- Readiness tab: the teacher check uses the resolved per-section teachers.

## Stage 2 — Workbook template and import preview

- Template with two sheets: Teachers (HR columns plus optional shortcut columns) and Teaching Assignments (teacher, subject, class, section), each with a help row and example.
- Parsing rules: detailed rows are taken one by one with no cross-products; shortcut columns expand only when Sheet 2 is empty; class aliases (VI, 6, Six, Class 6), section aliases (6A, 6-A, 6 A) and a small subject alias list (Math/Maths/Mathematics). Anything ambiguous is flagged, never guessed.
- Preview table of resolved assignments with status (OK, Unknown subject, Unknown class, Ambiguous, Duplicate) and actions Fix, Create new (subjects and classes only, using the existing creation flow), or Skip. Save stays disabled until everything is resolved or skipped.
- Saving adds assignments idempotently through the existing import function. Nothing is removed, and qualifications never become assignments.
- Summary with counts, readiness status and a Continue to Timetable button.

## Stage 3 — Generation lifecycle (separate approval, needs your Python files)

- Record unplaced lessons and mark a run "partial" instead of "solved"; teachers see published runs only.
- Python adapter update to use designated teachers, which needs `generate_timetable.py` and the adapter files uploaded.

## Not changed

Timetable settings, saved runs and entries, draft requirements (never auto-activated), logins/invitations, existing assignments, other schools' data.

## Technical details

- Migration (Stage 1): `ALTER TABLE teacher_subject_assignments ADD COLUMN section text NULL`; drop the existing unique constraint and add a unique index on `(school_id, academic_year_id, teacher_id, subject_id, class_name, coalesce(section,''))`. Additive; existing RLS/grants untouched. Shown for review before applying.
- Files: `TeachingAssignmentsMatrix.tsx`, `useTeachingAssignments.ts`, new `src/lib/teaching-assignment-resolution.ts`, `timetable-readiness.ts`, `timetable-api/index.ts` (additive GET field), later `teacher-import.ts`, `TeacherImportDialog.tsx`, `import-teacher-hr`, `teacher-downloads.ts`.
- Tests: acceptance scenarios 1–14, 16, 18 as pure/unit tests; 15 and 17 wait for Stage 3.
