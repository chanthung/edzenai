

## AI-Assisted Subject Creation (Nursery → Class 12)

A **"Quick Add Subjects"** flow on `Subjects.tsx` that lets admins go from zero subjects to a fully-populated curriculum in under 30 seconds — using a local board-based subject library plus optional AI suggestions for edge cases.

### What's already built (kept untouched)
- `subjects` table + `subject_class_assignments` junction (insert path already exists)
- `useCreateSubject` hook (handles dedupe by name + class assignment via upsert)
- "Add Subject" single-entry dialog on `/progress/subjects`
- Marks entry, report cards, competencies — **none of these are touched**

### Adapted from your spec (what changes vs. the prompt)

Two things in the prompt don't match this codebase, so I'm adapting:

1. **`school_settings.board` doesn't exist.** No board field on `schools`. → I'll add `board text` to `schools` with values `CBSE | ICSE | ISC | STATE_BOARD | OTHER` (nullable, defaults null). First time the new dialog opens, if board is null we ask once and persist it. Fallback per spec: detect from default Assessment Template name (look for "CBSE"/"ICSE"/"ISC" substring).

2. **Junction model is `class_name` (text), not `class_id`.** Existing schema uses class names like `"Class 5"`, `"Nursery"` — no `classes` table. → Dedupe constraint becomes `UNIQUE (school_id, lower(name), class_name)` on a new junction-aware check (we already have `UNIQUE (subject_id, class_name)` on `subject_class_assignments`; existing dedupe by name in `useCreateSubject` covers the rest). No breaking change.

### The 5 changes

**1. DB migration (small)**
- `ALTER TABLE schools ADD COLUMN board text` (nullable)
- No other schema changes — existing junction handles class assignments

**2. New file: `src/lib/subject-library.ts`**

Pure-frontend lookup table — no API call. Shape:

```ts
type ClassGroup = 'pre_primary' | 'primary' | 'middle' | 'secondary' | 'senior';
type Stream = 'science' | 'commerce' | 'arts';
type Board = 'CBSE' | 'ICSE' | 'ISC' | 'STATE_BOARD';

SUBJECT_LIBRARY: Record<Board, Record<ClassGroup, { name; code; type }[]>>
SENIOR_STREAMS: Record<Stream, { name; code; type }[]>

classifyClass(className): ClassGroup        // "Nursery"|"LKG"|"UKG" → pre_primary, "Class 5" → primary, etc.
generateSubjectCode(name): string           // uppercase, max 6 chars, strips vowels if needed
```

Seeded with realistic curricula:
- **Pre-primary**: English, Hindi, Numbers, EVS, Art, Rhymes
- **Primary (1-5)**: English, Hindi, Maths, EVS, Computer, Art, PE, GK
- **Middle (6-8)**: English, Hindi, Maths, Science, Social Studies, Sanskrit/3rd Lang, Computer, PE
- **Secondary (9-10)**: English, Hindi, Maths, Science, Social Science + board variants (ICSE adds History/Civics + Geography separately, etc.)
- **Senior (11-12)**: Common (English) + stream-specific (Sci: PCM/PCB; Com: Accounts/BST/Eco; Arts: History/Pol Sci/Psych/Sociology)

**3. New component: `src/components/progress/QuickAddSubjectsDialog.tsx`**

Replaces nothing — opens via a new **"⚡ Quick Add"** button next to existing "Add Subject":

```text
┌─────────────────────────────────────────────────────────┐
│ AI Subject Assistant            [ICSE Board detected] │
├─────────────────────────────────────────────────────────┤
│ 1. Pick classes:                                        │
│    [Nursery] [LKG] [Class 1] [Class 5] [Class 9]…       │
│                                                         │
│ 2. (auto-shown if Class 11/12 picked)                   │
│    Stream: ( ) Science ( ) Commerce ( ) Arts            │
│                                                         │
│ 3. Suggested subjects for ICSE • Middle:                │
│    [✓ English ENG] [✓ Maths MATH] [Science SCI]         │
│    [Social Sci SST] [Sanskrit SAN] [+ Custom…]          │
│                                                         │
│ 4. (optional) [✨ AI Suggest] for unusual subject       │
│    "describe what you teach…" → returns {name, code}    │
│                                                         │
│ 5. Selected (4): editable rows                          │
│    ┌─────────────────────────────────────┐             │
│    │ English   [ENG  ] [Regenerate] [×]  │             │
│    │ Maths     [MATH ] [Regenerate] [×]  │             │
│    └─────────────────────────────────────┘             │
│                                                         │
│           [Cancel]  [Create 4 Subjects]                 │
└─────────────────────────────────────────────────────────┘
```

Behavior:
- Board badge: pulls from `schools.board`. If null → a one-time inline prompt picks it and saves.
- Class chips read from existing `useUniqueClasses` (same source as today's dialog)
- Auto-groups picked classes → derives which library buckets to show
- Stream selector appears only when Class 11/12 is in the picked set
- Chips multi-select; clicking promotes to an editable row (name + code editable, regenerate code button)
- Duplicate guard: pre-flight check against current `subjects` list — already-existing names show a yellow "exists, will be assigned to new classes only" tag (existing `useCreateSubject` already upserts safely)

**4. New edge function: `suggest-subject` (optional AI fallback)**
- Single call to Lovable AI Gateway `google/gemini-3-flash-preview`
- Tool-call schema returns `{ name: string, code: string }` strictly
- Used only when admin clicks "AI Suggest" for a subject not in the library
- No auto-call on dialog open — keeps it instant and zero-cost by default

**5. Wire-up in `src/pages/progress/Subjects.tsx`**
- Add **"⚡ Quick Add"** button next to existing "Add Subject"
- On submit: loop selected rows → call existing `createSubject.mutateAsync` per row with all selected class names (existing hook already handles "subject exists → just upsert assignments")
- Toast: `"Created 6 subjects across 4 classes"`

### Files
- New: `supabase/migrations/<ts>_add_school_board.sql` (1 column add)
- New: `src/lib/subject-library.ts`
- New: `src/components/progress/QuickAddSubjectsDialog.tsx`
- New: `supabase/functions/suggest-subject/index.ts`
- Modified: `src/pages/progress/Subjects.tsx` (add button + mount dialog)
- Modified: `src/hooks/useSchool.ts` types (add `board: string | null`)

### Safety / non-breaking guarantees (from spec)
- Marks entry, report cards, competencies, existing subjects — **untouched**
- Existing single "Add Subject" dialog — **untouched**, sits next to new button
- All existing RLS on `subjects` + `subject_class_assignments` covers new inserts automatically
- Duplicate prevention uses existing `useCreateSubject` logic (case-insensitive name match → upserts class assignments instead of creating)
- AI Suggest is opt-in, never blocks the flow, never auto-approves
- Library is local — works offline, instant chip render, zero API cost for the common path

### Acceptance
- Open Quick Add → pick "Class 1, 2, 3, 4, 5" → 8 chips appear → click 6 → click Create → 6 subjects created and each assigned to all 5 classes in <30s
- Pick "Class 11" → stream selector appears → choose Science → PCM/PCB chips show
- Pick CBSE board → chips swap to CBSE curriculum; pick ICSE → ICSE curriculum (incl. split History/Civics + Geography)
- Re-running with same selections → no duplicates created, toast says "0 new (all already exist)"
- Marks entry + report cards continue to work unchanged

