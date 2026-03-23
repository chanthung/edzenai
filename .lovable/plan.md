

# Auto-Assign Student Fees via Class-Based Fee Templates

## Overview

Currently, after creating fee structures in Fee Setup, admins must manually open each student and toggle fee checkboxes one by one. This plan eliminates that repetitive work by linking fee structures to classes, then auto-assigning fees when students are created or imported.

## Current Architecture

- `fee_structures` table holds fee amounts per category per academic year per school — but has **no class association**
- `student_fees` table links a student to a fee structure (the assignment record)
- Students are created via manual form (`useCreateStudent`) or bulk Excel import (`BulkStudentUpload.tsx`)
- Both paths already know the student's `class_name` and `academic_year_id`

## Design Decision: Extend Existing Table vs New Junction Table

**Best approach: New junction table `fee_structure_classes`** — a many-to-many link between fee structures and class names, with an `auto_assign` flag.

This is cleaner than adding columns to `fee_structures` because one fee structure (e.g., "Tuition Fee") might apply to multiple classes, and one class might have multiple fee structures.

## Database Changes

### New table: `fee_structure_classes`

```sql
CREATE TABLE public.fee_structure_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  auto_assign boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fee_structure_id, class_name)
);

ALTER TABLE public.fee_structure_classes ENABLE ROW LEVEL SECURITY;

-- RLS: same pattern as fee_structures
CREATE POLICY "Admins can manage fee structure classes"
ON public.fee_structure_classes FOR ALL TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures WHERE school_id IN (SELECT get_user_school_ids())
));

CREATE POLICY "Admins can view fee structure classes"
ON public.fee_structure_classes FOR SELECT TO authenticated
USING (fee_structure_id IN (
  SELECT id FROM fee_structures WHERE school_id IN (SELECT get_user_school_ids())
));
```

### New DB function: `auto_assign_fees_for_student`

A `SECURITY DEFINER` function that, given a student ID and academic year ID, looks up the student's class, finds all fee structures with matching `fee_structure_classes` entries where `auto_assign = true`, and inserts `student_fees` records (skipping duplicates).

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_fees_for_student(
  _student_id uuid, _academic_year_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO student_fees (student_id, fee_structure_id)
  SELECT _student_id, fs.id
  FROM fee_structures fs
  JOIN fee_structure_classes fsc ON fsc.fee_structure_id = fs.id AND fsc.auto_assign = true
  JOIN students s ON s.id = _student_id AND s.class_name = fsc.class_name
  WHERE fs.academic_year_id = _academic_year_id
  ON CONFLICT DO NOTHING;
END;
$$;
```

This requires a unique constraint on `student_fees(student_id, fee_structure_id)`:

```sql
ALTER TABLE student_fees ADD CONSTRAINT student_fees_unique 
  UNIQUE (student_id, fee_structure_id);
```

## Code Changes

### 1. Fee Setup Page — Add "Apply to Classes" UI

**File: `src/pages/admin/FeeSetup.tsx`**

- In each `FeeStructureCard`, add a collapsible section showing class checkboxes
- Multi-select classes (derived from existing students' distinct `class_name` values)
- Toggle for "Auto-assign to new students" (the `auto_assign` flag)
- New hook: `src/hooks/useFeeStructureClasses.ts` — CRUD for the junction table

### 2. Auto-Assign on Student Creation

**File: `src/hooks/useStudents.ts` — `useCreateStudent`**

After creating the student and enrollment, call `supabase.rpc('auto_assign_fees_for_student', { _student_id, _academic_year_id })`.

### 3. Auto-Assign on Bulk Import

**File: `src/components/admin/BulkStudentUpload.tsx`**

After each batch insert + enrollment, call the same RPC for each inserted student.

### 4. Student Fee Manager — Keep as Override UI

**File: `src/components/admin/StudentFeeManager.tsx`**

- No removal — this becomes the "override" interface
- Add a subtle info banner: "Fees were auto-assigned based on class. You can customize below."

### 5. New Hook

**File: `src/hooks/useFeeStructureClasses.ts`**

- `useFeeStructureClasses(feeStructureId)` — fetch assigned classes
- `useUpdateFeeStructureClasses()` — bulk upsert/delete class assignments
- `useDistinctClasses()` — get distinct class names from students table

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `fee_structure_classes` table, unique constraint, RPC function |
| `src/hooks/useFeeStructureClasses.ts` | Create — CRUD for class assignments |
| `src/pages/admin/FeeSetup.tsx` | Modify — add class assignment UI per fee structure |
| `src/hooks/useStudents.ts` | Modify — call auto-assign RPC after student creation |
| `src/components/admin/BulkStudentUpload.tsx` | Modify — call auto-assign RPC after bulk import |
| `src/components/admin/StudentFeeManager.tsx` | Modify — add info banner about auto-assignment |

## User Experience Flow

1. **Admin sets up fees once**: Fee Setup → create Tuition Fee ₹50,000 → assign to "Class 1, Class 2, Class 3" → toggle auto-assign ON
2. **Student created**: Admin adds student in Class 2 → Tuition Fee automatically assigned
3. **Excel import**: 100 students imported → all get correct fees based on their class
4. **Override**: Admin opens individual student → can remove/add fees manually

