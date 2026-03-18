

# Plan: Refactor Subjects to Master Subject + Class Assignment

## Problem
Same subject (e.g. "English") is duplicated across classes, cluttering the subjects list. Each class gets its own row, making management painful.

## Solution Overview
1. Create a junction table `subject_class_assignments` to map subjects to classes
2. Migrate existing `class_name` data from `subjects` into the junction table
3. Remove `class_name` from `subjects` table
4. Update the UI to use multi-select for class assignment
5. Update `useSubjects` hook to support both filtered (by class via junction) and unfiltered queries

## Database Migration

**Step 1**: Create junction table and migrate data

```sql
-- Junction table
CREATE TABLE public.subject_class_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_id uuid NOT NULL,
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subject_id, class_name)
);

ALTER TABLE public.subject_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies (mirror subjects table policies)
CREATE POLICY "Admins can manage" ON public.subject_class_assignments FOR ALL
  TO authenticated USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Admins can view" ON public.subject_class_assignments FOR SELECT
  TO authenticated USING (school_id IN (SELECT get_user_school_ids()));
CREATE POLICY "Teachers can manage" ON public.subject_class_assignments FOR ALL
  TO public USING (school_id IN (SELECT get_teacher_school_ids()));
CREATE POLICY "Teachers can view" ON public.subject_class_assignments FOR SELECT
  TO public USING (school_id IN (SELECT get_teacher_school_ids()));
CREATE POLICY "Public can view" ON public.subject_class_assignments FOR SELECT
  TO public USING (true);
```

**Step 2**: Migrate existing data — deduplicate subjects and populate junction table

```sql
-- Insert class assignments from existing subjects
INSERT INTO public.subject_class_assignments (subject_id, school_id, class_name)
SELECT id, school_id, class_name FROM public.subjects
WHERE class_name IS NOT NULL;

-- For duplicate subjects (same name, code, type, school), keep one master and remap references
-- This requires:
-- 1. Identify duplicates
-- 2. Update student_marks, competencies to point to the master subject_id
-- 3. Move class assignments to the master
-- 4. Delete duplicate subject rows
-- 5. Drop class_name column from subjects
```

**Step 3**: Deduplication migration (careful — must remap FKs in `student_marks`, `competencies`, `student_competency_scores`)

```sql
-- Deduplicate: for each (school_id, lower(name), subject_type), keep the one with lowest created_at
WITH duplicates AS (
  SELECT id, school_id, lower(name) as lname, subject_type,
    ROW_NUMBER() OVER (PARTITION BY school_id, lower(name), subject_type ORDER BY created_at) as rn
  FROM subjects
),
masters AS (
  SELECT id as master_id, school_id, lname, subject_type FROM duplicates WHERE rn = 1
),
to_merge AS (
  SELECT d.id as old_id, m.master_id
  FROM duplicates d
  JOIN masters m ON d.school_id = m.school_id AND d.lname = m.lname AND d.subject_type = m.subject_type
  WHERE d.rn > 1
)
-- Update student_marks
UPDATE student_marks SET subject_id = tm.master_id
FROM to_merge tm WHERE student_marks.subject_id = tm.old_id;

-- Update competencies
UPDATE competencies SET subject_id = tm.master_id
FROM to_merge tm WHERE competencies.subject_id = tm.old_id;

-- Move class assignments
INSERT INTO subject_class_assignments (subject_id, school_id, class_name)
SELECT tm.master_id, sca.school_id, sca.class_name
FROM subject_class_assignments sca
JOIN to_merge tm ON sca.subject_id = tm.old_id
ON CONFLICT (subject_id, class_name) DO NOTHING;

-- Delete old assignments and subjects
DELETE FROM subject_class_assignments WHERE subject_id IN (SELECT old_id FROM to_merge);
DELETE FROM subjects WHERE id IN (SELECT old_id FROM to_merge);

-- Drop class_name column
ALTER TABLE subjects DROP COLUMN class_name;
```

## Hook Changes (`src/hooks/progress/useSubjects.ts`)

- Remove `class_name` from Subject interface
- `useSubjects(className?)`: When `className` provided, join with `subject_class_assignments` to filter. When not provided, return all unique subjects.
- `useCreateSubject()`: Accept `class_names: string[]` instead of `class_name`. Check for existing subject (case-insensitive match by name + type + school). If exists, only insert new class assignments. If not, create subject then insert assignments.
- `useUpdateSubject()`: Update subject fields + upsert/delete class assignments
- `useDeleteSubject()`: Cascade handles junction cleanup automatically
- New: `useSubjectClassAssignments(subjectId?)` — fetch assigned classes for a subject

## UI Changes (`src/pages/progress/Subjects.tsx`)

- **Modal**: Replace single "Class" dropdown with multi-select checkboxes for classes
- **Inline validation**: When typing a subject name, if it matches an existing subject, show info message: "Subject already exists. It will be assigned to selected classes."
- **Table**: Remove "Class" column, add "Assigned Classes" column showing badges/chips
- **Edit flow**: Load existing class assignments, allow modifying them via same multi-select

## Marks Entry (`src/pages/progress/MarksEntry.tsx`)

- `useSubjects(selectedClass)` already filters by class — the hook change (querying via junction table) makes this work transparently. No UI changes needed here.

## Parent View / Report Cards

- These query subjects via `student_marks` joins, so no changes needed — the subject_id FK remains intact.

## RPC Functions

- `get_student_marks_by_access_token` joins on `subjects.id` — still works since subject rows remain, just deduplicated.

## Files to Create/Modify

| File | Change |
|------|--------|
| DB Migration | Create junction table, migrate data, deduplicate, drop column |
| `src/hooks/progress/useSubjects.ts` | Refactor all hooks for junction table logic |
| `src/pages/progress/Subjects.tsx` | Multi-select classes, grouped display, inline validation |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

