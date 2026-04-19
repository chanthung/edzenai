
User chose to add visible City + State fields to signup form, plus Google Places autocomplete on School Name.

## Plan

### 1. Request Google Maps API key
Need `GOOGLE_MAPS_API_KEY` (Places API enabled, restricted by HTTP referrer to edzenai.com domains). This is a frontend key — exposed in client bundle, secured via referrer restrictions in Google Cloud Console.

### 2. New reusable component: `src/components/ui/school-autocomplete.tsx`
- Wraps existing `Input` (same shadcn styling — rounded-xl, border-input, h-10)
- Loads Places API via `@googlemaps/js-api-loader` once on mount
- Debounced (250ms) calls to `AutocompleteSuggestion.fetchAutocompleteSuggestions` with:
  - `input`: `"private school " + userText`
  - `includedPrimaryTypes: ['school']`
  - `includedRegionCodes: ['in']`
- Slices to **5 results max**
- Custom dropdown using Popover styling: `bg-popover border border-input rounded-xl shadow-md mt-1`, items with `hover:bg-accent`, min-h-10 tap targets
- On select: fetches Place details (`displayName`, `addressComponents`), extracts:
  - **City** ← `locality` (fallback: `administrative_area_level_2`)
  - **State** ← `administrative_area_level_1`
- Fires `onPlaceSelected({ name, city, state })`
- Graceful fallback to plain Input if API key missing or load fails (no console spam)

### 3. Update `src/pages/auth/Signup.tsx`
- Add two new state vars: `city`, `state`
- Replace School Name `Input` with `<SchoolAutocomplete>`
- Add City field (plain Input, free text, editable)
- Add State field — use existing `INDIAN_STATES` Select (consistent with `CreateSchoolDialog`)
- Both fields auto-fill on Place selection but remain user-editable
- Pass `city`, `state` in `signUp` user metadata so onboarding edge function can persist them later

### 4. Update `src/pages/auth/Onboard.tsx` (Google SSO path)
- Same: replace School Name with `<SchoolAutocomplete>`, add City + State fields
- Pass `city`, `state` to `onboard-school` edge function body (additive — backend ignores extras until updated)

### 5. Add dependency
`@googlemaps/js-api-loader` (~10KB, official Google package)

### Layout
Signup form gets two new rows after School Name:
```text
[ School Name (autocomplete) ]
[ City ............ ] [ State (select) ]
[ Admin Name ......................... ]
```
On mobile, City and State stack vertically.

### Files touched
- new: `src/components/ui/school-autocomplete.tsx`
- edit: `src/pages/auth/Signup.tsx`
- edit: `src/pages/auth/Onboard.tsx`
- new: `.npmrc` not needed — public package
