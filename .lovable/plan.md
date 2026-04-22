

## One-Click School Onboarding — guided full setup in <60s

Replace the existing minimal 4-step `GettingStarted` wizard with a single "Set up everything in one go" flow that creates the academic year, board profile, subjects (per board × class), and starter fee structures — all from one form, with a preview & confirm step.

### Important schema realities (adapted from spec)

The spec assumes a `classes` table and a `sections_per_class` table. **This codebase has neither** — classes are implicit (text on students/subjects), sections are text on student records. So:

- "Create classes" → just **stored as the school's selected class list** (used to drive subject assignment + later student creation defaults). We don't insert empty class rows.
- "Create sections" → stored as a **default sections list** the admin will use when adding students. No standalone section table.
- We persist the chosen class & section defaults on `schools` via two new nullable columns (`default_classes text[]`, `default_sections text[]`) so /admin/students and other modules can prefill them.

Everything else in the spec maps cleanly to existing tables.

### What the new flow does

**One screen, three tabs (Configure → Preview → Done):**

```text
Configure
─────────────────────────────────
School name      [pre-filled, editable]
Board            (•) CBSE  ( ) ICSE  ( ) ISC  ( ) State Board
Academic Year    [2025-26]  Start [Apr 1]  End [Mar 31]
Classes          [Nursery] [LKG] [UKG] [Class 1]…[Class 12]   (all on by default)
Sections         [A] [B]   (A+B on by default, click to add C/D/E)
Streams (11-12)  [✓ Science] [✓ Commerce] [✓ Arts]   (only if Class 11/12 picked)

Fee setup (starter)
  ✓ Tuition Fee     ₹[ 30000 ]/year   (mandatory)
  ☐ Transport Fee   ₹[  6000 ]/year   (optional)
  ☐ Activities Fee  ₹[  3000 ]/year   (optional)

           [ Preview Setup → ]
```

**Preview** — read-only summary card before any DB write:

```text
You're about to create:
  • Academic year: 2025-26 (Apr 1 – Mar 31)
  • 16 classes × 2 sections = 32 class-sections
  • 47 subjects across all classes (CBSE)
       Pre-Primary: 6 · Primary: 8 · Middle: 8 · Secondary: 7 · Senior Sci/Com/Arts: 18
  • 1 fee category, 1 fee structure, 1 installment per class
  
[ ← Back ]                          [ Create Everything ]
```

**Done** — success screen with the 3 CTAs from the spec (Add Students / Import Excel / Invite Teachers).

### What gets written (atomic-ish, in order)

For each step, we **skip-if-exists** (never overwrite). Idempotent — safe to re-run.

1. `schools` UPDATE: `board`, `default_classes[]`, `default_sections[]`, `onboarding_completed=true`
2. `academic_years` INSERT (skip if a year with same name already exists; mark new one active)
3. `subjects` + `subject_class_assignments` — uses existing `useCreateSubject` logic (case-insensitive name match → upsert assignments). For each picked class:
   - resolve `classifyClass(className)` → group
   - pull `getSuggestions(board, [group], stream?)` from existing `subject-library.ts`
   - for senior classes (11-12), add subjects for each picked stream
4. `fee_categories` INSERT (only categories the admin checked + amount > 0; skip if name already exists for school — uses existing default seeded set if none)
5. `fee_structures` INSERT — one per (category × academic_year). Uses existing `useCreateFeeStructure` which auto-creates a "Full Payment" installment with default due date

If any step fails after partial writes, we surface the error and **leave what was created** (no DB transactions across REST calls — but each step is independently idempotent, so admin can simply hit "Create Everything" again and it skips what's done).

### Non-breaking guarantees

- **Skip onboarding if data exists:** before showing the form, check if `school.onboarding_completed === true` → redirect to `/admin` (already done today). Plus, if any of `academic_years`, `subjects`, or `fee_structures` already has rows for this school, show: "Setup already done — [Go to Dashboard]" with a small "Run again to add missing pieces" link that re-enters the flow in **idempotent mode** (everything skip-if-exists).
- Existing modules (Students, Fees, Marks, Reports, Promotions) read from the same tables — they get the seeded data automatically, no code changes required.
- The current `BulkStudentUpload` step is preserved — it now appears on the **Done** screen as the "Import Excel" CTA.

### The 5 file changes

**1. DB migration** — `ALTER TABLE schools ADD COLUMN default_classes text[], ADD COLUMN default_sections text[]` (board column already exists from prior work)

**2. Replace** `src/pages/admin/GettingStarted.tsx` with the new 3-tab Configure → Preview → Done flow described above. Old "select classes / sections / upload students" steps are absorbed.

**3. New file** `src/lib/onboarding-engine.ts` — pure helper that takes `(school, board, year, classes, sections, streams, feeRows)` and:
   - returns a `previewSummary()` object (counts for the preview screen, no DB writes)
   - exposes `executeOnboarding()` that runs the 5 ordered idempotent steps above using existing supabase client + reusing existing hooks' insert logic where possible

**4. Modify** `src/hooks/useSchool.ts` — add `default_classes: string[] | null` and `default_sections: string[] | null` to the `School` type

**5. Use existing libraries** — no new edge function, no AI call. Subject library (`src/lib/subject-library.ts`) and `useCreateSubject` deduplication already cover the needs.

### Acceptance

- Fresh school → Configure (board=CBSE, all 16 classes, 2 sections, Tuition ₹30k checked) → Preview → Create → AY 2025-26 active, ~30 unique subjects created and assigned to the 16 classes, 1 fee category + 1 structure + 1 "Full Payment" installment, `onboarding_completed=true`, redirected to Done
- Re-running the flow on a school that already has subjects → 0 duplicates, toast "Already set up — added 0 new items"
- Picking Class 11 + Class 12 with Science + Commerce → senior subjects from both streams appear in preview & get created
- Existing single-student add, marks entry, fee assignment for new students continue to work unchanged
- Total wall-clock time on a fresh school: under 60 seconds

