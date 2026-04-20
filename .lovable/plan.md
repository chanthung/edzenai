
User enabled the legacy "Places API" in Google Cloud. No code changes required — the existing `src/components/ui/school-autocomplete.tsx` already uses `AutocompleteService` + `PlacesService`, which is what that API powers.

## Plan

1. No file edits.
2. User hard-refreshes `https://edzenai.com/signup?plan=pro` (Cmd/Ctrl+Shift+R) and types 2+ characters in School Name.
3. Suggestions should appear within ~250ms in the custom dropdown. Selecting one auto-fills City and State.

If suggestions still don't appear after a hard refresh + 1 minute wait (Google propagation), share the latest console error and I'll diagnose further (most likely the API key's "API restrictions" allowlist also needs **Places API** added alongside Maps JavaScript API and Places API (New)).
