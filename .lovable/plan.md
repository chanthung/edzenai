
## Goal (what will change)
Fix **Marks Entry** so it is strictly:
1) Academic Year → 2) Assessment → 3) **Class (mandatory)** → 4) **Section (mandatory)** → 5) **Subject (filtered)**

And the **Subject dropdown must**:
- Show only subjects configured for the selected class
- Show each subject only once (no duplicates within that class)
- Reset when class/section changes
- Optionally display subject code to avoid confusion

---

## What’s causing the problem today
- `MarksEntry.tsx` currently loads **all subjects for the school** via `useSubjects()` and displays them without class filtering.
- There is no “subject belongs to class” attribute in the current `useSubjects` hook interface, and the Subjects admin screen also doesn’t capture a class association.
- Class selection is optional today (it has an “All Classes” option) and there is no section filter dropdown at all.

---

## Implementation approach
We’ll implement **class-wise subject mapping** by adding a `class_name` field to subjects and using it for filtering.

### Decision (no more ambiguity)
- One subject record belongs to **one class** (e.g., “English” for Class 3 is a separate subject row from “English” for Class 4).
- Sections (A/B/C) will be selected from the student list and used for filtering students; subjects remain class-level.

This matches your required workflow and eliminates ambiguity/duplicate subject names.

---

## Backend / Database changes (safe + minimal)
1. **Add `class_name` column** to `subjects`:
   - `class_name text NULL`
   - Nullable so existing data doesn’t break immediately.
2. **Add an index** for quick filtering:
   - `(school_id, class_name)`
3. **Prevent duplicates inside a class** with a partial unique index:
   - Unique on `(school_id, class_name, name)` **where class_name is not null**
   - This avoids breaking existing “global / unassigned” subjects that have `class_name = NULL`.

Result: a subject can’t be duplicated twice for the same class.

---

## Frontend changes

### A) Update subjects hook to support class filtering
**File:** `src/hooks/progress/useSubjects.ts`

Changes:
- Extend `Subject` interface to include `class_name: string | null`.
- Update `useSubjects` to accept an optional `className?: string`:
  - When `className` is provided: query `.eq('class_name', className)`
  - When not provided: keep current behavior for the Subjects admin screen (show all).
- Ensure query key includes className: `['subjects', schoolId, className]`.

This lets Marks Entry fetch “only subjects for Class 3”.

---

### B) Update “Subjects” admin screen to assign subjects to classes
**File:** `src/pages/progress/Subjects.tsx`

Add:
- A “Class” dropdown in the Add/Edit Subject dialog:
  - Options pulled from existing student `class_name` values (same pattern used in Assessments page).
  - Make it **required** for creating a subject going forward (recommended).
- Add a **Class column** in the subjects table view so admins can see mapping.

Why this is needed: otherwise filtering will show “No subjects for this class” until mapping is done.

---

### C) Fix Marks Entry workflow (Class + Section mandatory, Subjects filtered)
**File:** `src/pages/progress/MarksEntry.tsx`

#### 1) Make Class mandatory
- Remove “All Classes” option.
- Add an empty default state: “Select Class”.
- Disable Assessment/Subject/Save until class is selected (as per your required workflow).

#### 2) Add Section dropdown (mandatory)
- Add `selectedSection` state.
- Compute available sections based on selectedClass:
  - `uniqueSections = students.filter(s => s.class_name === selectedClass).map(s => s.section).filter(Boolean)`
- Section dropdown becomes active only after class is selected.

#### 3) Filter students by Class + Section
- `filteredStudents` must use both selectedClass and selectedSection.
- If class/section changes, clear marks state (to avoid saving marks under wrong filters).

#### 4) Filter assessments by class
- `useAssessments(effectiveYearId, selectedClass)` (the hook already supports this)
- This reduces mistakes where an assessment is meant for another class.

#### 5) Filter subjects by selected class and reset on changes
- Replace `useSubjects()` with `useSubjects(selectedClass)` (only when class selected).
- When class changes:
  - reset `selectedSubjectId` to `""`
  - reset `selectedSection` to `""`
  - clear `marks` state
- If subject list no longer contains currently selected subject, reset it as well.

#### 6) Improve Subject dropdown labels to reduce confusion
- Display as:
  - `English (ENG)` if code exists
  - `English` if not
This helps teachers verify they picked the right one even if names are similar.

#### 7) Tighten validation messaging
- If teacher tries saving without:
  - assessment → error
  - class → error
  - section → error
  - subject → error
Show clear toast messages.

---

## UX behavior checklist (acceptance criteria)
After changes:
- Class selection is required (cannot proceed without it)
- Section selection is required
- Subject dropdown shows only subjects for that class
- No repeated subject names within the class (and backend prevents adding duplicates)
- Changing class resets section + subject + marks
- “No subjects configured for this class” empty-state message is shown if none exist
- Teachers can confidently enter marks for Class X, Section Y, Subject Z

---

## Rollout / data migration note (important)
Because `class_name` will start as NULL for existing subjects:
- Initially, Marks Entry will show **no subjects** for a class until you assign classes to subjects in **Progress → Subjects**.
- This is intentional to avoid wrong entries and to satisfy “Do NOT show subjects from other classes”.

(If you want, later we can add a one-time helper screen to bulk-assign subjects to classes.)

---

## Testing plan (end-to-end)
1. Go to **Progress → Subjects**
   - Create subjects for Class 3: English, Math, EVS, Science (with optional codes).
2. Go to **Progress → Marks Entry**
   - Select Year → Assessment → Class 3 → Section A
   - Confirm Subject dropdown shows only those 4 subjects (once each)
   - Switch to Class 2 → confirm subject list changes and selection resets
3. Enter marks and save
   - Reload page, pick same filters, ensure marks load correctly.

---

## Files to change (summary)
- `src/hooks/progress/useSubjects.ts` (add class_name + optional class filter)
- `src/pages/progress/Subjects.tsx` (assign class to subject + show column)
- `src/pages/progress/MarksEntry.tsx` (mandatory class/section, subject filtering + reset logic)
- Database change: add `subjects.class_name` + indexes (for filtering + duplicate prevention)

