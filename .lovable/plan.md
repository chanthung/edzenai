
# Add Tamil, Kannada, Marathi — Map Only (English Fallback)

## What changes

1. **Expand `Lang` type and supported list** in `src/i18n/parent/detect.ts` to include `ta`, `kn`, `mr`.
2. **Add labels**: Tamil → தமிழ், Kannada → ಕನ್ನಡ, Marathi → मराठी.
3. **Update `STATE_LANGUAGE_MAP`**:
   - Tamil Nadu → `['ta']`
   - Karnataka → `['kn']`
   - Maharashtra → `['mr', 'hi']`
   - Goa → `['mr']` (Marathi is co-official)
4. **Create empty locale files** `ta.json`, `kn.json`, `mr.json` — copies of `en.json` so all keys resolve to English strings for now.
5. **Update DB constraint** via migration: allow `ta`, `kn`, `mr` in `students.preferred_language`.
6. **Update `fromBrowser()`** in detect.ts to recognize `ta`, `kn`, `mr` prefixes.
7. **Update `ParentI18nProvider`** in `src/i18n/parent/index.tsx` to import and register the three new locale files.

## Files to create
- `src/i18n/parent/locales/ta.json` (copy of en.json)
- `src/i18n/parent/locales/kn.json` (copy of en.json)
- `src/i18n/parent/locales/mr.json` (copy of en.json)

## Files to edit
- `src/i18n/parent/detect.ts` — Lang type, SUPPORTED_LANGS, LANG_LABELS, STATE_LANGUAGE_MAP, fromBrowser()
- `src/i18n/parent/index.tsx` — import new locale files

## Database migration
```sql
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_preferred_language_chk;
ALTER TABLE public.students
  ADD CONSTRAINT students_preferred_language_chk
  CHECK (preferred_language IS NULL OR preferred_language IN ('en','hi','as','bn','ta','kn','mr'));
```

No other files affected. The switcher and banner already read from `SUPPORTED_LANGS` and `LANG_LABELS` dynamically, so they will show the new options automatically.
