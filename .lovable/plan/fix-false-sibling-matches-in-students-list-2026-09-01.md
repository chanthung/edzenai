# Fix false sibling matches in Students list

## Problem

Sibling detection currently links two students if **any one** of these matches:
parent phone, parent name, guardian name, or **address**.

Because a bulk-imported school (Mount Sinai) has many students sharing a colony
address (e.g. "NIROPEN COLONY"), unrelated students are grouped as siblings —
Anjali Kumari is shown with three children who have different fathers, different
phone numbers and different surnames.

## Fix

Change the matching rule so address is never enough on its own:

1. **Primary signal — parent phone.** Same non-empty parent phone = siblings.
2. **Secondary signal — parent/guardian name.** Only counts when the parent name
   (or guardian name) matches exactly AND the student's own surname context is not
   contradicted; to keep it simple and safe, require the name match to be a full
   normalized match of a name longer than 2 characters AND at least one of the two
   students to have no parent phone recorded (so it can't override a phone mismatch).
3. **Address is dropped entirely** as a matching signal.
4. If both students have parent phones and they differ, they are never siblings,
   regardless of name similarity.

Address stays visible in the family popover as informational detail — it just no
longer drives grouping.

## Technical details

- Single change point: `findSiblings()` in `src/components/admin/SiblingIndicator.tsx`
  (also consumed by `src/components/admin/StudentFamilyCard.tsx`, so both views are
  fixed at once).
- Phone comparison normalized via the existing digit-only normalization (strip
  spaces/+91 prefix) before comparing.
- No database or import-logic changes; this is display-side grouping only.
