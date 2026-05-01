# Multilingual Parent Portal

Lightweight, fast multi-language support for the parent link experience (`/view/:name/:token`) with optional geo-based language suggestion. No new heavy libraries.

## Scope decisions

- **Languages (v1):** English, Hindi, Assamese, Bengali — exactly as you listed. The state-language map will reference Tamil/Kannada/etc., but only EN/HI/AS/BN strings ship in v1. Other languages fall back to English with a "coming soon" note in the suggestion banner so we don't ship empty translation files.
- **Scope of UI:** Parent portal only (`ParentView`, `ParentFeesTab`, `ParentProgressTab`, `ParentAttendanceTab`, `PaymentProofUploader`, empty/error states). Admin/teacher dashboards stay English.
- **Don't translate:** student/parent/school names, class labels (e.g. "Class 5"), amounts, dates (numeric format), roll numbers, phone numbers — exactly as requested.
- **No external i18n library.** Custom ~30-line context + JSON dictionaries → keeps bundle tiny (<5 KB gzipped per language, lazy-loaded).

## Stability safeguards (so it doesn't break the site like before)

- No changes to `vite.config.ts` chunking.
- No new top-level imports in `App.tsx` or `main.tsx`. The i18n provider is mounted only inside the `ParentView` route subtree, so the rest of the app is untouched.
- Geo lookup is `fetch()` with a 1.5 s timeout + try/catch; failure is silent (no banner). Never blocks render.
- Translation files are imported statically (small) so there are no dynamic-import edge cases in production.

## Architecture

```text
src/i18n/parent/
  index.ts              # ParentI18nProvider, useT(), Lang type
  detect.ts             # resolvePreferredLanguage(), state→langs map
  geo.ts                # fetchGeoState() with timeout + abort
  locales/
    en.json
    hi.json
    as.json
    bn.json

src/components/parent/
  LanguageSwitcher.tsx  # top-bar dropdown (4 options)
  LanguageSuggestionBanner.tsx
```

### Preference resolution order

1. `parents.preferred_language` from DB (loaded with `useParentView`)
2. `localStorage["parent_lang_<token>"]`
3. `navigator.language` (if `hi/as/bn/en`)
4. Geo state → first language in map (suggestion banner only — not auto-applied)
5. Default: `en`

### Persistence

- Instant: `localStorage` on every switch.
- DB: new column `students.preferred_language text` (we store on the student row since there's no `parents` table; one student = one parent contact in this schema). Saved via a tiny edge function `set-parent-language` that authorizes by `access_token` (no login). Best-effort, fire-and-forget — UI never waits.

### Geo flow

1. Render UI in resolved language immediately (steps 1-3 above).
2. After mount, if no DB/localStorage preference exists, call `https://ipapi.co/json/` with 1.5 s timeout.
3. Map `region` (state) → candidate languages via `STATE_LANGUAGE_MAP`.
4. If candidates include a supported language and current lang is `en`, show the dismissible banner once (flag stored in `localStorage["parent_lang_suggested_<token>"] = "1"`).
5. Banner buttons: switch to suggested language(s), or "Keep English". All dismiss the banner permanently for that token.

### State → language map (covers all 28 states + 8 UTs)

Full mapping in `detect.ts`. Examples:

- Assam → `[as, bn]`
- West Bengal, Tripura → `[bn, hi]`
- Tamil Nadu → `[ta]` (falls back to EN in v1)
- Karnataka → `[kn]` (falls back to EN in v1)
- Hindi belt (UP, MP, Bihar, Rajasthan, Haryana, Delhi, Uttarakhand, HP, Jharkhand, Chhattisgarh) → `[hi]`
- Default / unmapped → `[]` (no banner)

### Translation keys (initial set, ~50 keys)

Grouped: `common.*` (loading, error, retry), `header.*`, `tabs.*` (fees/progress/attendance), `fees.*` (status: paid/pending/overdue/partial, dueDate, amount, payNow, uploadProof, selectAll, total), `progress.*`, `attendance.*` (present/absent/late/holiday), `proof.*` (upload dialog text), `errors.*`, `banner.*`.

Format: flat dotted keys, simple `{name}` interpolation. `useT()` returns `(key, vars?) => string`.

## WhatsApp language support (Part 8)

- `send-parent-link` reads `students.preferred_language`. If set and ≠ `en`, picks a localized template from a new `supabase/functions/_shared/parent-link-templates.ts` (4 plain-text variants — same content, translated). Mayavi sends free-text, no template approval needed.
- `send-fee-reminders` and `send-test-fee-reminder` use the same helper. The templates the admin configures stay English (admin UI), but auto-reminders use the parent's preferred language when available; fall back to admin template otherwise.
- Phone normalization, retry logic, and `parent_link_dispatches` logging unchanged.

## Performance

- 4 JSON files, ~2 KB each → bundled with the parent route (already lazy via `ParentView`'s lazy children pattern). No extra network hop.
- Geo call is non-blocking, timeout 1.5 s, aborted on unmount.
- No new dependencies in `package.json`.
- Switcher = pure React state, no reload.

## Database change

One migration:

```sql
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS preferred_language text;
-- short check: only allow supported codes or null
ALTER TABLE public.students
  ADD CONSTRAINT students_preferred_language_chk
  CHECK (preferred_language IS NULL OR preferred_language IN ('en','hi','as','bn'));
```

RLS already covers students; the new edge function uses service role + access_token verification, so no policy change needed.

## Files to create

- `src/i18n/parent/index.tsx`
- `src/i18n/parent/detect.ts`
- `src/i18n/parent/geo.ts`
- `src/i18n/parent/locales/{en,hi,as,bn}.json`
- `src/components/parent/LanguageSwitcher.tsx`
- `src/components/parent/LanguageSuggestionBanner.tsx`
- `supabase/functions/set-parent-language/index.ts` (+ `verify_jwt = false` in `config.toml`)
- `supabase/functions/_shared/parent-link-templates.ts`
- DB migration

## Files to edit

- `src/pages/parent/ParentView.tsx` — wrap subtree in `ParentI18nProvider`, render switcher + banner, replace hard-coded strings with `t(...)`.
- `src/components/parent/ParentFeesTab.tsx`, `ParentProgressTab.tsx`, `ParentAttendanceTab.tsx`, `PaymentProofUploader.tsx` — replace user-facing strings with `t(...)`.
- `src/hooks/useParentView.ts` — also return `preferred_language`.
- `supabase/functions/send-parent-link/index.ts`, `send-fee-reminders/index.ts`, `send-test-fee-reminder/index.ts` — use language-aware templates.

## Failsafe / acceptance

- Geo fails or times out → no banner, English UI, manual switcher still works.
- Switcher always visible in header. Can users fall back to En if they want later?
- Choice persists across reloads (localStorage) and across devices (DB).
- Names/amounts/dates remain unchanged in any language.
- No changes to vite chunking, `App.tsx`, `main.tsx`, or auth flow → publish stability preserved.