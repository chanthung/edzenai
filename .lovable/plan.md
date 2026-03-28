

# Enhanced Sibling & Parent Details in Student Table

## Summary

Upgrade the existing student table and sibling indicator to show richer family information via tooltips and hover cards, including a "Family" column with sibling count badge, enhanced parent contact tooltips, family-based row grouping, and a search-by-parent filter. Also add a student profile "Family" section accessible from the table.

## What Changes

### 1. Enhanced `SiblingIndicator` → `FamilyIndicator` (rewrite `src/components/admin/SiblingIndicator.tsx`)

- Replace the small icon with a **badge** showing `👪 N members` (sibling count + 1 for the student).
- On hover, show a **HoverCard** (not just tooltip) containing:
  - **Siblings section**: each sibling's name, class/section, with a link to filter the table to that student.
  - **Parent/Guardian section**: parent name, phone, email, address (truncated if >60 chars).
- On mobile (use `useIsMobile`), replace hover with a **Dialog** triggered on tap.
- Add `aria-describedby` for accessibility.

### 2. Enhanced Parent Column in `src/pages/admin/Students.tsx`

- Current: shows parent name and phone as plain text.
- New: wrap in a **TooltipProvider** so hovering reveals full contact details:
  - Parent name, phone (with +91 prefix), email, guardian name, full address.
- Add subtle styling for the tooltip content.

### 3. Family Row Grouping (visual)

- In the student table, compute `familyGroups` by grouping students sharing the same parent_phone (the strongest sibling signal).
- Apply alternating subtle background colors (`bg-blue-50/30` / default) for rows belonging to the same family group.
- This is purely visual — no DB changes needed.

### 4. Search by Parent Name/Phone

- Extend the existing `searchQuery` filter to also match against `parent_name` and `parent_phone` fields.
- This allows finding all students in a family by searching the parent's name or number.

### 5. Student Profile Family Section (new component `src/components/admin/StudentFamilyCard.tsx`)

- A card component shown inside the `EditStudentDialog` (or as a new expandable section).
- Displays:
  - **Parent cards**: name, phone, email, address.
  - **Sibling list**: name, class/section for each detected sibling.
- Reuses the same sibling detection logic from the indicator.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/SiblingIndicator.tsx` | Rewrite as `FamilyIndicator` with HoverCard + mobile Dialog |
| `src/components/admin/StudentFamilyCard.tsx` | New — family detail card for profile/edit views |
| `src/pages/admin/Students.tsx` | Update: parent column tooltip, search filter extension, family row grouping, import new components |

## Technical Notes

- No database changes needed — all sibling detection remains logic-based using existing fields.
- Uses existing UI components: `HoverCard`, `Badge`, `Dialog`, `Tooltip`, `useIsMobile`.
- The `FamilyIndicator` component remains a drop-in replacement for `SiblingIndicator` with the same props interface.
- Family row grouping uses a Map keyed by normalized parent_phone; students without a phone get no grouping color.

