
# Plan: Add Academic Year Selection When Creating Students

## Overview
Add an "Academic Year" dropdown to the "Add New Student" dialog that allows admins to associate students with a specific academic year when creating them. The system will use the existing `student_enrollments` table (which is currently empty) to store this relationship.

---

## Current Situation

The database already has a `student_enrollments` table with:
- `student_id` (links to student)
- `academic_year_id` (links to academic year)
- `class_name` and `section` (for year-specific enrollment details)

However, this table is currently **not being used**. Students are being created with `class_name` and `section` stored directly on the `students` table without any academic year association.

---

## Implementation Steps

### Step 1: Update the Add Student Form UI

**File: `src/pages/admin/Students.tsx`**

- Import the `useAcademicYears` and `useActiveAcademicYear` hooks
- Add an `academic_year_id` field to the `newStudent` state (default to active year)
- Add a dropdown selector for Academic Year between "Student Name/Roll Number" row and "Class/Section" row
- The dropdown will show all academic years for the school, with the active year pre-selected

```text
+------------------------------------------+
| Student Name *         | Roll Number     |
+------------------------------------------+
| Academic Year *        |                 |   <-- NEW FIELD
| [2024-25 ▼ dropdown]   |                 |
+------------------------------------------+
| Class                  | Section         |
+------------------------------------------+
```

### Step 2: Update Student Creation Logic

**File: `src/hooks/useStudents.ts`**

- Extend `StudentInsert` interface to include optional `academic_year_id`
- Modify `useCreateStudent` mutation to:
  1. Create the student record (as before)
  2. If `academic_year_id` is provided, create a `student_enrollment` record linking the student to that academic year

```typescript
// Pseudocode for the two-step creation:
// 1. Insert into students table
const { data: student } = await supabase.from('students').insert({...}).select().single();

// 2. Insert into student_enrollments table
if (academic_year_id) {
  await supabase.from('student_enrollments').insert({
    student_id: student.id,
    academic_year_id: academic_year_id,
    class_name: student.class_name,
    section: student.section
  });
}
```

### Step 3: Update Edit Student Dialog

**File: `src/components/admin/EditStudentDialog.tsx`**

- Add the same Academic Year dropdown to the edit form
- Fetch the student's current enrollment and pre-populate the dropdown
- When saving, update or create the enrollment record accordingly

---

## Technical Details

### State Changes in Students.tsx

```typescript
// New state field
const [newStudent, setNewStudent] = useState({
  name: "",
  roll_number: "",
  class_name: "",
  section: "",
  academic_year_id: "",  // <-- NEW
  parent_name: "",
  parent_phone: "",
  // ... rest
});

// Pre-select active academic year when dialog opens
useEffect(() => {
  if (activeAcademicYear && dialogOpen) {
    setNewStudent(prev => ({ 
      ...prev, 
      academic_year_id: activeAcademicYear.id 
    }));
  }
}, [activeAcademicYear, dialogOpen]);
```

### Hook Modifications

The `useCreateStudent` hook will be updated to accept an optional `academic_year_id` and create the enrollment record in a single transaction-like flow.

---

## User Experience

1. Admin opens "Add Student" dialog
2. The Academic Year dropdown is pre-filled with the currently active year
3. Admin can change the academic year if needed
4. When "Add Student" is clicked, both the student and their enrollment are created
5. This ensures every new student is properly associated with an academic year

---

## Files to be Modified

| File | Change |
|------|--------|
| `src/pages/admin/Students.tsx` | Add Academic Year dropdown to Add Student dialog |
| `src/hooks/useStudents.ts` | Update `StudentInsert` interface and `useCreateStudent` to handle enrollment |
| `src/components/admin/EditStudentDialog.tsx` | Add Academic Year selector with enrollment fetch/update logic |

---

## Future Considerations

Once this is implemented, the system can later be enhanced to:
- Show students filtered by academic year in the list view
- Allow students to be enrolled in multiple academic years (year-over-year tracking)
- Track class/section changes between years
- Generate year-wise reports
