# Fix: fees stay assigned to classes that were removed

## What's happening

Confirmed in the database for Mount Sinai School:

- "Computer fee" is currently applied to Class 3–Class 10 only (LKG, Nursery, UKG, Class 1, Class 2 are unchecked).
- But student fee assignments still exist for 9 LKG, 5 Nursery, 11 UKG, 6 Class 1 and 6 Class 2 students.

Cause: when the class list of a fee is edited, the app only adds assignments for newly ticked classes. Un-ticking a class removes it from the fee's class list but leaves every already-created student assignment in place. So students keep the fee forever, and the Manage Fees dialog correctly shows it as "Assigned".

A second, smaller issue: the Manage Fees dialog lists every fee of the school, with no hint that a fee doesn't apply to that student's class.

## The fix

1. **Un-ticking a class now removes that fee from students of that class.**
   When fee classes are saved, for each class removed from the list, delete the fee assignment for students of that class — except students who already have a recorded payment or an uploaded payment proof against that fee (those stay, so history is never broken).
   This applies to all schools and all future edits.

2. **One-time cleanup of existing bad data.**
   Remove fee assignments where the student's class is no longer in the fee's class list, again skipping any with payments/proofs. This clears the LKG/Nursery/UKG/Class 1/Class 2 Computer fee rows and the same issue in any other school.

3. **Clarity in the Manage Fees dialog.**
   Show a small "Not for this class" note on fees whose class list doesn't include the student's class, so an accidental manual assignment is visible at a glance. Admins can still assign it deliberately.

## Technical notes

- `useUpdateFeeStructureClasses` (`src/hooks/useFeeStructureClasses.ts`): after computing `existingSet`, also compute removed classes and delete matching `student_fees` rows via a school-scoped delete, excluding students that have `payments` or `payment_proofs` on installments of that fee structure. Invalidate `student-fees` / `all-student-fees` as it already does.
- Cleanup runs as a one-off data statement (not a schema migration), guarded by the same payments/proofs exclusion.
- `FeeListGrouped.tsx`: pass the student's class name and compare against `useAllFeeStructureClasses` entries to render the badge. Presentation only.
