## Goal

Make the parent portal automatically detect the user's location and:

1. **Auto-set** the language based on their state (not just suggest via a banner)
2. **Prioritize** location-relevant languages in the language switcher dropdown
3. Keep the suggestion banner as a fallback for cases where geo-detection is slow

## Changes

### 1. Auto-set language from geolocation (`src/i18n/parent/index.tsx`)

When no language is stored in DB or localStorage, trigger the geo lookup and auto-switch to the top suggested language for that state. Currently `resolveInitialLanguage` only checks DB, localStorage, and browser language. We'll add an effect that runs the geo lookup on mount and calls `setLang` (with `persist: false` initially) if the user hasn't chosen yet.

- After provider mounts with default `en`, if `hasUserChosen` is false, run `fetchGeoState()`
- If a state is detected and has mapped languages, auto-set to the first mapped language
- This happens silently (no banner needed for this case)

### 2. Prioritize languages in the switcher (`src/components/parent/LanguageSwitcher.tsx`)

- Accept the detected state as context (via a small state in the i18n provider or a separate hook)
- Show location-relevant languages first, then a separator, then remaining languages
- Example for Maharashtra: Marathi, Hindi, English | then Tamil, Kannada, etc.

### 3. Update the i18n provider to expose detected state

- Add `detectedState` and `suggestedLangs` to the context so both the banner and switcher can use them
- Store geo result in provider state after the fetch completes

### 4. Update the edge function (`supabase/functions/set-parent-language/index.ts`)

- Add `ta`, `kn`, `mr` to the `SUPPORTED` set (currently only `en`, `hi`, `as`, `bn`)

### 5. Remove/simplify the suggestion banner

- Since language is now auto-set, the banner becomes a "switch back to English" option
- Keep it but simplify: show only if geo auto-set a non-English language,But keep English as default with option given to parents to switch to local, whichever auto-set detects 

## Technical Details

- Geo detection uses the existing `fetchGeoState()` (ipapi.co, 1.5s timeout)
- Auto-set only fires when: no DB preference, no localStorage, no explicit browser language match
- The auto-set does NOT persist to DB (avoids false positives from VPNs); it persists to localStorage only after user confirms via banner or switcher
- `STATE_LANGUAGE_MAP` already has all state mappings from the previous update