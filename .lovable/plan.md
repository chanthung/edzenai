

# Class Promotion Feature

## What It Does

When an academic year ends, admins need to "promote" students to the next class (e.g., Class 5 → Class 6). This feature adds a **Promote Students** tool that:

1. Lets the admin select a **source academic year** and a **target academic year**
2. Shows all students enrolled in the source year, grouped by class
3. Auto-maps each class to the next grade (Class 5 → Class 6, UKG → Class 1, etc.)
4. Allows overrides (e.g., hold back a student, skip a grade, mark as "passed out" for Class 12)
5. Creates new `student_enrollments` records in the target year and updates `students.class_name`/`section`

## Architecture

Your existing `student_enrollments` table already supports this perfectly — each enrollment links a student to an academic year with a class/section. Promotion simply means inserting new enrollment rows for the next year.

No database schema changes needed.

## Implementation

### 1. New Component: `PromoteStudentsDialog`
- Location: `src/components/admin/PromoteStudentsDialog.tsx`
- Two dropdowns: "From Year" and "To Year" (populated from `academic_years`)
- Fetches enrollments for the source year, groups by class
- Shows a table with columns: Student Name, Current Class, Promoted Class, Action (Promote / Retain / Exclude)
- Default mapping logic using grade number extraction (same pattern as `getNepStage`)
- "Promote All" button that batch-inserts enrollments and updates `students.class_name`

### 2. Grade Promotion Mapping Utility
- Location: `src/lib/grade-promotion.ts`
- `getNextClass(className)` — returns the next class string:
  - Nursery → LKG, LKG → UKG, UKG → Class 1
  - Class N → Class N+1 (up to 12)
  - Class 12 → "Passed Out" (excluded from promotion)

### 3. Integration Point
- Add a "Promote Students" button on the **Academic Years** page (`src/pages/admin/AcademicYears.tsx`) or the **Students** page
- Only shown when there are 2+ academic years

### 4. Data Flow
```text
Source Year Enrollments → Map each to next class → Preview table → Confirm → Batch insert new enrollments + update students table
```

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/grade-promotion.ts` | New — grade increment utility |
| `src/components/admin/PromoteStudentsDialog.tsx` | New — promotion UI with preview table |
| `src/pages/admin/AcademicYears.tsx` | Add "Promote Students" button |

