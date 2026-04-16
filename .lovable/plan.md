

## Plan: Add "Rows Per Page" Selector to Students Table

### Current State
The Students page fetches all students at once and renders them in a single table with no pagination. For schools with hundreds or thousands of students, this causes performance issues.

### Approach
Add **client-side pagination** (no query changes needed since related features like fee counts, sibling grouping, and bulk selection depend on the full student list being available). The page size preference will persist via localStorage.

### Changes (single file: `src/pages/admin/Students.tsx`)

**1. Add pagination state**
- `pageSize` (default 50, restored from localStorage)
- `currentPage` (starts at 1, resets on filter/search/pageSize changes)

**2. Add page size dropdown**
- Place next to the existing class filter dropdown in the toolbar row
- Options: 25, 50, 100, 200
- Styled consistently with existing Select components

**3. Slice filtered students for display**
- Compute `paginatedStudents` from `filteredStudents` using `slice((page-1)*size, page*size)`
- Only the table body rendering changes to use `paginatedStudents`
- All other logic (fee counts, sibling grouping, bulk select-all) continues using full `filteredStudents`

**4. Add pagination controls below the table**
- Previous / Next buttons
- Page indicator: "Page X of Y"
- Total count display: "Showing 1-50 of 342 students"
- Uses existing Pagination UI components from `src/components/ui/pagination.tsx`

**5. Persist preference**
- Save to `localStorage` key `students_page_size`
- Load on mount

### What stays unchanged
- Data fetching (all students loaded at once — needed for fee map, sibling detection, export)
- Sorting, filtering, search logic
- Bulk selection behavior (select-all applies to current filtered set)
- All dialogs and actions

### Impact Assessment
- **Single file edit** — only `Students.tsx`
- No database changes
- No API changes
- No breaking changes to other components

