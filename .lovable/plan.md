

# Fix: Auto-Assign Fees Automatically from Fee Setup (Remove Manual Step)

## Problem

The current flow requires admins to go to the Students page and click "Assign Fees" or open each student's "Fees" dialog — defeating the purpose of auto-assignment. Fees should be assigned automatically when class mappings are configured in Fee Setup, not require a separate manual step.

## Root Cause

When an admin toggles class checkboxes in Fee Setup's "Apply to Classes" section, the code only saves the `fee_structure_classes` junction records. It does NOT actually run `auto_assign_fees_for_student` for existing students in those classes. The RPC only fires during new student creation or bulk import.

## Solution

### 1. New DB function: `auto_assign_fees_for_class`

Create a new RPC that assigns a specific fee structure to ALL existing students in a given class for an academic year. This runs when the admin saves class assignments in Fee Setup.

```sql
CREATE OR REPLACE FUNCTION public.auto_assign_fees_for_class(
  _fee_structure_id uuid,
  _class_name text,
  _academic_year_id uuid,
  _new_admission_only boolean DEFAULT false
) RETURNS integer
-- Inserts student_fees for all students in the class
-- If _new_admission_only, skips students with prior-year enrollments
-- Returns count of assignments made
```

### 2. Update `useUpdateFeeStructureClasses` hook

After saving class assignments, call the new RPC for each newly added class (when `auto_assign` is true). This makes Fee Setup the single place where fees get configured AND applied.

### 3. Remove "Assign Fees" bulk button from Students page

Since fees are now auto-assigned from Fee Setup, the manual "Assign Fees (N)" button and the per-student "Fees" button become unnecessary clutter. The "Fees" button can remain as an override/view mechanism but is no longer required for normal operation.

### 4. Keep StudentFeeManager as override UI

The "Fees" dialog stays available for edge cases (manual override) but the normal flow no longer depends on it.

## Files to Change

| File | Change |
|------|--------|
| Migration SQL | Create `auto_assign_fees_for_class` RPC |
| `src/hooks/useFeeStructureClasses.ts` | After saving class assignments, call RPC for each class with `auto_assign=true` |
| `src/pages/admin/Students.tsx` | Remove "Assign Fees" bulk button (no longer needed) |

## Flow After Fix

1. Admin goes to Fee Setup → creates fee structure → assigns classes → toggles auto-assign ON
2. System immediately assigns that fee to ALL existing students in selected classes
3. New students added later also get auto-assigned (existing RPC)
4. No manual steps required on Students page

