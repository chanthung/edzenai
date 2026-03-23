

# Add Category Groups & New-Admission-Only Fee Logic

## What Already Exists
- Categories tab with Mandatory/Optional toggle — already working
- Fee structures with class assignment and auto-assign toggle — already working
- Auto-assign RPC that runs on student creation/import — already working

## What We're Adding

### 1. Category Group field
Add a `category_group` text field to `fee_categories` so related items (e.g., Trousers, Jacket, Skirt all grouped under "Uniforms") display together in the Categories tab and Student Fee Manager.

**UI change in Categories tab**: Add a "Group" input in the Add/Edit Category dialog. Show group label as a subtle tag on each category card. Categories with the same group visually cluster together.

### 2. "New Admissions Only" toggle
Add a `new_admission_only` boolean to `fee_structure_classes`. When enabled alongside auto-assign, fees are only auto-assigned to students who have NO enrollment in any previous academic year.

**UI change in Fee Structures tab**: Below the existing "Auto-assign to new students" toggle, show a second toggle: "New admissions only — Skip for students continuing from a previous year". Only visible when auto-assign is ON.

### 3. Updated auto-assign RPC
Modify `auto_assign_fees_for_student` to check enrollment history when `new_admission_only = true`. If the student has enrollments in earlier academic years, skip those fees.

## Database Changes

```sql
-- 1. Add category_group to fee_categories
ALTER TABLE fee_categories ADD COLUMN category_group text;

-- 2. Add new_admission_only to fee_structure_classes
ALTER TABLE fee_structure_classes 
  ADD COLUMN new_admission_only boolean NOT NULL DEFAULT false;

-- 3. Update the RPC to respect new_admission_only
CREATE OR REPLACE FUNCTION auto_assign_fees_for_student(
  _student_id uuid, _academic_year_id uuid
) RETURNS void ...
  -- For each match:
  --   If new_admission_only AND student has prior-year enrollments → SKIP
  --   Else → INSERT
```

## Code Changes

| File | Change |
|------|--------|
| Migration SQL | Add column + update RPC |
| `src/hooks/useFeeCategories.ts` | Add `category_group` to interface & mutations |
| `src/hooks/useFeeStructureClasses.ts` | Add `new_admission_only` to interface & mutation |
| `src/pages/admin/FeeSetup.tsx` | Add "Group" input in category dialog; group categories visually; add "New admissions only" toggle below auto-assign |
| `src/components/admin/StudentFeeManager.tsx` | Group fees by `category_group` with section headers; show "(optional)" for skipped new-admission-only fees |

## Example Workflow

1. Admin creates categories: Trousers, Jacket, Sports Uniform, Skirt — all with group **"Uniforms"**
2. Creates fee structures with prices, assigns to classes
3. Enables **auto-assign ON** + **new admissions only ON**
4. New student admitted → all uniform items auto-assigned (compulsory for new admissions)
5. Existing student promoted to new year → uniform items NOT auto-assigned; admin opens Student Fee Manager and manually picks only what the student needs (e.g., just Trousers)

