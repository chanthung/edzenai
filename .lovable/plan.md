
# Multi-Select Bulk Share for Parent Links

## Overview
Add checkbox selection to the Students table, allowing you to select multiple students and share their parent links in one action instead of clicking "Share" for each student individually.

## How It Will Work

```text
+------------------------------------------+
| Students                    [Add Student] |
|------------------------------------------|
| [Search...]           [Class Filter ▼]   |
|------------------------------------------|
|                                          |
| [Share Selected (3)] ← Shows when any    |
|                        students selected |
+------------------------------------------+
| ☑ | Student    | Class | Parent | ...   |
|---|------------|-------|--------|-------|
| ☑ | Rahul S.   | 10th  | Vijay  | ...   |
| ☐ | Priya M.   | 9th   | Meena  | ...   |
| ☑ | Amit K.    | 10th  | Suresh | ...   |
| ☑ | Neha P.    | 8th   | Rekha  | ...   |
+------------------------------------------+
```

## Features
1. **Checkbox column** - First column with checkboxes for each student row
2. **Select All checkbox** - In table header to select/deselect all visible students
3. **Bulk Share button** - Appears when 1+ students selected, shows count
4. **Smart filtering** - Only students with valid phone numbers can be shared
5. **Confirmation dialog** - Shows list of students to receive links before sending
6. **Progress feedback** - Shows sending progress for multiple students

---

## Technical Details

### Frontend Changes (src/pages/admin/Students.tsx)

**New State Variables:**
```typescript
const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
const [isBulkSending, setIsBulkSending] = useState(false);
const [bulkShareDialogOpen, setBulkShareDialogOpen] = useState(false);
```

**New Functions:**
```typescript
// Toggle single student selection
const toggleStudentSelection = (studentId: string) => {...}

// Toggle all visible students
const toggleSelectAll = () => {...}

// Handle bulk share action
const handleBulkShare = async () => {...}

// Get students eligible for sharing (have phone numbers)
const selectedShareableStudents = useMemo(() => {...}, [selectedStudents, filteredStudents])
```

**UI Changes:**
1. Add `Checkbox` import from `@/components/ui/checkbox`
2. Add new `<TableHead>` with select-all checkbox
3. Add new `<TableCell>` with row checkbox for each student
4. Add "Share Selected" button near search/filter area
5. Add bulk share confirmation dialog

### Backend Changes
The existing `send-parent-link` edge function already handles single student sharing. For bulk share, we'll call it multiple times (sequentially to avoid overwhelming n8n).

---

## Implementation Steps

### Step 1: Add Selection State
Add state variables to track selected students and bulk sending status.

### Step 2: Add Select All Checkbox in Header
Add a checkbox in the table header that selects/deselects all visible (filtered) students.

### Step 3: Add Row Checkboxes
Add a checkbox at the beginning of each student row.

### Step 4: Add Bulk Share Button
Add a floating action button that appears when students are selected, showing the count.

### Step 5: Add Bulk Share Confirmation Dialog
Create a dialog that lists all selected students and confirms the bulk send action.

### Step 6: Implement Bulk Share Logic
Send links sequentially to avoid rate limiting, with progress feedback.

---

## User Experience
- Checkboxes are always visible for quick selection
- "Share Selected" button shows count: "Share Selected (3)"
- Students without phone numbers are excluded from bulk share
- Confirmation dialog shows which students will receive links
- Toast notifications show progress: "Sent 3 of 5 links..."
- Selection persists while filtering (only hides non-matching selected items)
- Clear selection after successful bulk send
