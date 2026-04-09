

# Plan: Filter Subjects by Teacher Assignment + Add Time to Attendance

## Problem
Teacher George is assigned only English and EVS, but sees all 4 subjects (Math, Science included) in the Subjects list, Marks Entry, and Attendance pages. The root cause: `useSubjects()` and `useSubjectsWithClasses()` fetch ALL school subjects without filtering by teacher's `teacher_subject_assignments`.

Additionally, attendance needs a time input field.

## Changes

### 1. Create a hook to get the current teacher's assigned subject IDs
**New file**: `src/hooks/progress/useMySubjectIds.ts`
- For teachers: query `teacher_subject_assignments` using the logged-in user's teacher ID
- For admins: return `null` (meaning "show all")
- Reuse the pattern from `useMyClassAssignments`

### 2. Update `useSubjects` hook to filter by teacher assignments
**Edit**: `src/hooks/progress/useSubjects.ts`
- Accept an optional `teacherSubjectIds` parameter
- When provided, add `.in('id', teacherSubjectIds)` filter
- This affects Marks Entry subject dropdown

### 3. Update `useSubjectsWithClasses` to filter for teachers
**Edit**: `src/hooks/progress/useSubjects.ts`
- Accept optional `teacherSubjectIds`
- When provided, filter subjects to only those IDs
- This affects the Subjects list page

### 4. Update Subjects page for teachers
**Edit**: `src/pages/progress/Subjects.tsx`
- Import the new hook, pass IDs to `useSubjectsWithClasses`
- Teachers should only see their assigned subjects in the list
- Hide Add/Edit/Delete buttons for teachers (they shouldn't manage subjects they aren't assigned to)

### 5. Update Marks Entry page
**Edit**: `src/pages/progress/MarksEntry.tsx`
- Import the new hook, filter subjects by teacher's assigned subject IDs
- Subject dropdown only shows assigned subjects

### 6. Add time field to Attendance
**Edit**: `src/pages/progress/Attendance.tsx`
- Add a time input (`<Input type="time" />`) next to the date picker
- Store time alongside date when saving attendance
- This requires a DB migration to add a `time` column to the `attendance` table

### 7. Database migration for attendance time
- Add `marked_time` column (type `time`, nullable) to `attendance` table

## Technical Details
- The key query pattern:
  ```sql
  SELECT subject_id FROM teacher_subject_assignments 
  WHERE teacher_id = (SELECT id FROM school_teachers WHERE user_id = auth.uid())
  ```
- The `useMySubjectIds` hook will first resolve the teacher record, then fetch assigned subject IDs
- All filtering is done at the query level for efficiency
- Admin users bypass filtering entirely (they see everything)

