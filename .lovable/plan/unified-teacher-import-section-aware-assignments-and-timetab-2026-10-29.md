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

## Stage 1 — Section-aware assignments and Edit Teacher (approved with amendments)

Verified checks: database is PostgreSQL 17. Cherry/all schools have 65 assignment rows and 0 duplicates under the current unique rule (teacher, subject, school, class, year). Teachers can currently read draft runs and entries (rules only check school membership). No class-section master table exists.

- **Uniqueness:** add nullable `section`; replace the current unique index with a `UNIQUE NULLS NOT DISTINCT` constraint on (school, year, teacher, subject, class, section). Empty section = all sections. It is a real named constraint, so saves can target it directly. Existing 65 rows are kept unchanged and counted before/after.
- **Section values:** trimmed and uppercased (" a " → "A") by a database rule and the shared helper.
- **Section master list:** since none exists, valid sections for a class/year = sections of enrolled students that year plus sections in configured timetable subject requirements. Per-teacher rows are never the master. An unknown section is refused with a clear message. (Decision point: tell me if you prefer a dedicated sections list instead.)
- **Resolution helper:** section rows override class-wide rows for that section only; a visible warning when an override changes the covering teacher; redundant pairs (same teacher+subject both class-wide and section rows) are reported, never deleted. Multiple teachers are kept as listed, not treated as interchangeable.
- **Generator guard:** timetable connection adds `section` per assignment and `section_aware: false`, existing fields unchanged. The Readiness tab warns "N section-specific assignments are not yet honored by the generator." There is no Generate button in the app; the Readiness status becomes "Blocked" while such rows exist, and the connection's save step refuses new runs while they exist, so a partial run can't be saved.
- **Out-of-date banner:** each run records an input fingerprint (hash of assignments, requirements, availability, slots, breaks, rooms, room rules, included teachers) in its existing `constraints_snapshot` at save time. The Timetable view compares it with the current fingerprint and shows "Timetable out of date". Existing runs have no fingerprint, so they show as out of date (Cherry's current run is genuinely stale). The banner clears only after a new run is saved from the current state.
- **Included in timetable:** new `included_in_timetable` flag on teacher records, defaulting by designation (Librarian, Office Assistant, Accountant role → off; everything else → on). Unfamiliar designations default on and are listed for review, never auto-excluded. Editable in Edit Teacher. Excluded staff are skipped by readiness checks and the connection.
- **Edit Teacher:** assignments default to "All sections"; admins can narrow to specific sections; chips like "English: 6-A, 6-B", "Hindi: 7 (all sections)". Login linking untouched.
- **Draft access:** replace the teacher read rules on runs and entries so teachers see only `status = 'published'`. Admin and engine rules unchanged.

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

- Migration (shown for review before applying): add `section text NULL` + normalisation trigger + section validation trigger; add constraint `tsa_unique_assignment UNIQUE NULLS NOT DISTINCT (school_id, academic_year_id, teacher_id, subject_id, class_name, section)`, then drop old `tsa_teacher_subject_school_class_year_uidx` (constraint is strictly equivalent for existing NULL-section rows); add `school_teachers.included_in_timetable boolean NOT NULL DEFAULT true` with a one-time designation backfill; replace `timetable_runs_teacher_read` and `timetable_entries_teacher_read` with published-only versions. Pre/post row-count check of all 65 rows.
- Files: `TeachingAssignmentsMatrix.tsx`, `useTeachingAssignments.ts`, `EditTeacherDialog.tsx`, new `src/lib/teaching-assignment-resolution.ts`, new `src/lib/timetable-input-fingerprint.ts`, `timetable-readiness.ts`, `ReadinessSection`, `TimetableViewSection.tsx`, `timetable-api/index.ts` (additive GET fields; POST guard + fingerprint), later `teacher-import.ts`, `TeacherImportDialog.tsx`, `import-teacher-hr`, `teacher-downloads.ts`.
- Tests: override semantics, override-change warning, redundant detection, section case/whitespace normalisation, migration compatibility (old rows = class-wide), fingerprint change/clear, included-flag defaults, generator guard; live checks for school isolation and teacher draft denial.
