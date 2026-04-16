

## Plan: Bulk Delete Students

### Current State
The Students page already has checkbox-based multi-selection (`selectedStudents` Set) used for bulk WhatsApp link sharing. No database schema changes needed — we'll use hard delete via the existing `useDeleteStudent` pattern.

### Approach
Add a "Delete Selected" button to the existing selection toolbar, with a confirmation dialog requiring the user to type "DELETE". No soft-delete column needed (no `is_deleted` column exists, and adding one would require migration + RLS changes across many tables). Hard delete is consistent with the existing single-delete behavior.

### Changes (single file: `src/pages/admin/Students.tsx`)

**1. Add bulk delete state**
- `bulkDeleteDialogOpen` boolean
- `bulkDeleteConfirmText` string (must match "DELETE")
- `isBulkDeleting` boolean + progress tracking

**2. Add "Delete Selected" button**
- Appears in the existing selection action bar (where "Share via WhatsApp" already shows)
- Red/destructive styling, only visible when `selectedStudents.size > 0`
- Gated behind `!isAccountant` (admin-only, matching existing delete permissions)
- Wrapped in `RestrictedButton` for subscription check

**3. Add confirmation dialog**
- AlertDialog with warning message showing count
- Text input: "Type DELETE to confirm"
- Action button disabled until input === "DELETE"

**4. Bulk delete logic**
- Loop through selected IDs, call `supabase.from('students').delete().eq('id', id)` individually (respects RLS)
- Track success/fail counts
- On complete: clear selection, invalidate queries, show toast with counts

**5. Permission check**
- Hide bulk delete button for accountants (`isAccountant` flag already available)
- Subscription restriction check via existing `isRestricted` / `canPerform('delete_student')`

### What stays unchanged
- Existing selection logic, checkboxes, bulk share
- No database migrations
- No new hooks

