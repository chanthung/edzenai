
This is a substantial cross-cutting feature touching 5+ pages. Let me build it as a reusable system.

## Architecture

**Core (framework-agnostic):**
- `src/lib/auto-save/AutoSaveManager.ts` — class managing timers, localStorage drafts, triggers
- `src/lib/auto-save/types.ts` — types

**React integration:**
- `src/hooks/useAutoSave.ts` — React hook wrapping the manager
- `src/components/auto-save/AutoSaveIndicator.tsx` — pill badge (desktop + mobile responsive)
- `src/components/auto-save/DraftRecoveryBanner.tsx` — soft recovery banner

**Integrate into existing pages:**
- `src/pages/progress/MarksEntry.tsx`
- `src/pages/progress/Attendance.tsx`
- `src/pages/admin/FeeSetup.tsx`
- `src/pages/admin/Students.tsx` (EditStudentDialog)

For this first pass I'll wire the core system + indicator + banner, and integrate into **Marks Entry** and **Attendance** (the two highest-value forms with continuous edits). Fee Setup and Students will get the banner+indicator hooked up using the same hook — they already have explicit save buttons so the integration is small.

## Behavior details
- 30s interval auto-save when dirty
- 10s idle debounce after last change
- `visibilitychange` + `beforeunload` flush
- localStorage key: `edzen:autosave:<namespace>:<scopeKey>` storing `{ data, savedAt }`
- Compare draft timestamp vs server `lastSavedAt` prop → show banner only if draft newer
- Silent failure with retry on next tick
- Manual save cancels timer, sets state to "Saved ✓"
- "Last saved: X ago" via relative time, updated every 15s

Starting now.
