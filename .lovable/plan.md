

# Plan: Three-Way Teacher–Subject–Class Mapping

## Problem
When a teacher is assigned "English", they automatically get access to ALL classes English is mapped to (Class 2–10). In reality, a teacher teaches English only for specific classes (e.g., Class 4, 5, 8, 9).

## Current Data Model
`teacher_subject_assignments` has: `teacher_id`, `subject_id`, `school_id` with unique constraint on `(teacher_id, subject_id)`.

Teacher's class access is derived by looking up ALL classes from `subject_class_assignments` for their assigned subjects — no per-class granularity.

## Solution

### 1. Database Migration
- Add `class_name text` column to `teacher_subject_assignments`
- Drop existing unique constraint `(teacher_id, subject_id)`
- Add new unique constraint `(teacher_id, subject_id, class_name)`
- Backfill existing rows: for each current assignment, create one row per class from `subject_class_assignments`

### 2. Edit Teacher Dialog — New UI
Replace flat subject checkboxes with an expandable subject-class picker:
- Each subject shown with a checkbox (toggles all classes for that subject)
- When a subject is checked, show indented class checkboxes underneath (only classes that subject is mapped to via `subject_class_assignments`)
- Admin can select specific classes per subject (e.g., English → only Class 4, 5)

### 3. Update `useTeacherSubjects` Hook
- Fetch returns `{ subject_id, class_name }[]` pairs instead of just `subject_id[]`
- Save mutation inserts one row per subject-class combination
- Expose both `assignedSubjectIds` (deduplicated) and full `assignments` array

### 4. Update `useMySubjectIds` Hook
- Return `{ subjectId, className }[]` pairs for teachers
- Consumer hooks can filter by both subject AND class

### 5. Update `useMyClassAssignments` Hook
- Derive classes directly from `teacher_subject_assignments.class_name` column (no longer needs to join through `subject_class_assignments`)

### 6. Update MarksEntry
- When filtering subjects for a selected class, only show subjects where the teacher has that specific class assigned (not just any class for that subject)

### 7. Update Attendance
- Class list derived from distinct `class_name` values in `teacher_subject_assignments` for the logged-in teacher

## Files Changed
- **New migration**: Add `class_name` to `teacher_subject_assignments` + backfill
- **`src/components/admin/EditTeacherDialog.tsx`**: Expandable subject-class picker UI
- **`src/hooks/useTeacherSubjects.ts`**: Return and save subject-class pairs
- **`src/hooks/progress/useMySubjectIds.ts`**: Return subject-class pairs for filtering
- **`src/hooks/useTeacherClasses.ts`**: Simplify `useMyClassAssignments` to read directly from new column
- **`src/pages/progress/MarksEntry.tsx`**: Filter subjects by selected class for teachers
- **`src/pages/progress/Attendance.tsx`**: Minor — class derivation already works via `useMyClassAssignments`

## What Won't Break
- Admin users bypass all filtering (no change)
- Subject management (Subjects page) unaffected — subjects and their class mappings remain independent
- Assessments, Report Cards, competencies — all use subject/class independently, no teacher filtering needed there
- RLS policies unchanged — they check `school_id` not class-level access

