

## Problem

The ICSE template has 3 terms: "1st Assessment", "2nd Assessment", "3rd Assessment". The template is already assigned to classes 2, 3, 5, 9. However, the auto-create logic was added *after* the assignments were made, so no assessment records were created in the `assessments` table. The Marks Entry dropdown only shows manually-created assessments ("Term March", "End Term Feb", "Mid Term").

Requiring users to manually remove and re-assign each class is confusing and error-prone.

## Solution

Two changes:

### 1. Add a "Sync Assessments" button on ClassAssignment panel
For each existing assignment, add a sync action that triggers `createAssessmentsFromTerms` without needing to remove/re-assign. This gives the admin a one-click way to populate missing assessments.

### 2. Auto-sync on component load
When the ClassAssignment component loads and detects existing assignments, automatically run the sync for all of them. This is safe because `createAssessmentsFromTerms` already skips duplicates.

### Files to modify
- **`src/components/admin/templates/ClassAssignment.tsx`**:
  - Add a `useEffect` that runs when `assignments`, `school`, and `activeYear` are available — loops through all assignments and calls `createAssessmentsFromTerms` for each
  - Add a "Sync" button next to each assignment row as a manual fallback
  - Both are safe due to existing duplicate-skip logic

### What this fixes
- Opening the Settings → Templates page will auto-create the missing "1st Assessment", "2nd Assessment", "3rd Assessment" records for classes 2, 3, 5, 9
- These will then appear in the Marks Entry assessment dropdown immediately

