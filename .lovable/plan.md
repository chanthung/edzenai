

# Add Gender, DOB, Age, Social Category, Aadhaar, and Religion to Students

## Database Migration

Add 5 new columns to the `students` table:

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `gender` | text | Yes | Values: male, female, other |
| `date_of_birth` | date | Yes | Used to auto-calculate age |
| `social_category` | text | Yes | General, Minority, OBC, SC, ST |
| `aadhaar_number` | text | Yes | 12-digit Aadhaar card number |
| `religion` | text | Yes | Buddhism, Christianity, Hinduism, Islam, Jainism, Judaism, Sikhism, Zoroastrianism |

Age is **not stored** -- it is calculated from `date_of_birth` on the client side (e.g., `differenceInYears(new Date(), dob)`).

No RLS changes needed -- existing policies cover all columns.

## Code Changes

### 1. `src/hooks/useStudents.ts`
- Add `gender`, `date_of_birth`, `social_category`, `aadhaar_number`, `religion` to `Student` and `StudentInsert` interfaces.

### 2. `src/pages/admin/Students.tsx` (Add Student form)
- Add fields to `newStudent` state and the add-student dialog form:
  - Gender dropdown (Male / Female / Other)
  - Date of birth date picker
  - Social Category dropdown (General, Minority, OBC, SC, ST)
  - Aadhaar Number text input (12 digits)
  - Religion dropdown (8 options listed above)

### 3. `src/components/admin/EditStudentDialog.tsx`
- Add the same 5 fields to the edit form with pre-populated values.
- Display calculated age next to the DOB field (read-only).

### 4. `supabase/functions/process-student-excel/index.ts`
- Add `gender`, `date_of_birth`, `social_category`, `aadhaar_number`, `religion` to the AI column mapping target fields so Excel imports can capture these.

### 5. Student detail/list views
- Show age (calculated) where student details are displayed.

## Age Calculation Logic
```typescript
function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
```

Displayed as "X years" next to the DOB picker in both add and edit forms.

