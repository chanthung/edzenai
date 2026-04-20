
The user pasted a snippet showing the **legacy** `google.maps.places.Autocomplete` widget with a working API key (`AIzaSyAYke-5Iq4_4JAdjOOK9bWVhFudSQsP3rA`). They want me to use this approach instead of the new `AutocompleteSuggestion` API I'm currently using — which is failing with `InvalidKey`.

Two issues to address:
1. **API key**: The provided key works (user tested it). The current stored secret is likely wrong/truncated. I'll update the `GOOGLE_MAPS_API_KEY` secret with this value.
2. **API choice**: The legacy `Autocomplete` widget is simpler and works with broader key permissions. It's deprecated by Google (March 2025) but still functional for years. Given the new API keeps failing and the user has a working snippet using the legacy one, switch to it.

## Plan

### 1. Update API key
Update `GOOGLE_MAPS_API_KEY` secret to `AIzaSyAYke-5Iq4_4JAdjOOK9bWVhFudSQsP3rA` so the existing `get-maps-key` edge function returns a working key.

### 2. Rewrite `src/components/ui/school-autocomplete.tsx`
Replace the new-API implementation with the legacy `Autocomplete` widget approach, but keep our custom dropdown styling so it matches shadcn inputs (Google's default dropdown looks foreign).

Approach:
- Load Maps JS via `@googlemaps/js-api-loader` with `libraries: ['places']`
- Use `google.maps.places.AutocompleteService` (legacy, works with basic Places API enablement) for predictions
- Use `google.maps.places.PlacesService` for details (city/state extraction)
- Filter: `types: ['school']`, `componentRestrictions: { country: 'in' }`, prepend "private school" to bias
- Limit to 5 suggestions
- Keep custom dropdown UI (rounded-xl, border-input, popover styling, MapPin icons)
- On select: extract `name`, `locality`/`administrative_area_level_2` (city), `administrative_area_level_1` (state) from address components
- Keep `gm_authFailure` handler + graceful fallback to plain input

This way the user gets:
- A working autocomplete (legacy API has fewer enablement gotchas)
- Same beautiful custom dropdown matching the form
- Same City/State auto-fill behavior

### 3. No other changes
`Signup.tsx`, `Onboard.tsx`, edge function, config — all stay as is. The component's external API (`value`, `onChange`, `onPlaceSelected`) is unchanged.

## Files touched
- update secret `GOOGLE_MAPS_API_KEY`
- rewrite `src/components/ui/school-autocomplete.tsx`

## After approval
Refresh the signup page and start typing — suggestions should appear within ~250ms.
