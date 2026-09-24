# Extend `timetable-api` Edge Function: add read-only `breaks` to the response

## Scope
- Touch **only** `supabase/functions/timetable-api/index.ts`.
- No schema, RLS, secret, or other Edge Function changes. Strictly read-only.
- Keep both existing authentication paths byte-identical in behavior:
  1. Engine path: `x-timetable-engine-secret` header + constant-time compare against `TIMETABLE_ENGINE_SECRET` → service-role client (privileged read-only).
  2. Signed-in path: Bearer token → `get_user_school_ids()` + `get_teacher_school_ids()` authorization → caller-scoped client.

## Changes (all inside `supabase/functions/timetable-api/index.ts`)
1. Add `fetchBreaks(client, school_id, academic_year_id)` mirroring `fetchTimeSlots`:
   - Query `timetable_breaks` filtered by **both** `school_id` and `academic_year_id`.
   - Select only: `id, school_id, academic_year_id, weekday, break_type, after_period, duration_minutes, is_active`.
   - `.order("weekday", { ascending: true }).order("after_period", { ascending: true })` (null weekdays — "all working days" — sort last per Postgres default).
   - On query error: log server-side, return `{"error": "Internal error"}` 500 (same pattern as time slots).
   - Success: `json({ school_id, academic_year_id, breaks: data ?? [] })`-shaped data passed upward.
2. In `Deno.serve`, after authorization succeeds in **either** path, run `fetchTimeSlots` and `fetchBreaks` (same client, same ids) and combine into one response:
   ```json
   { "school_id": "...", "academic_year_id": "...", "time_slots": [...], "breaks": [...] }
   ```
   - Run the two fetches in parallel (`Promise.all`) where each path builds its Response, so the 200 body contains both arrays. `time_slots` content and ordering remain exactly as today.
3. No new parameters, no new auth logic, no writes, no generation logic.

## Deployment & verification
- Deploy via `supabase--deploy_edge_functions` with `["timetable-api"]`.
- Read-only smoke tests against the live function:
  - No credentials → 401 (unchanged).
  - Wrong engine secret → 401 (unchanged).
  - Malformed ids → 400 (unchanged).
  - Engine-secret path (header present, value compared against the stored secret) → 200 containing `time_slots` **and** `breaks` arrays with only the requested fields, breaks ordered by weekday then after_period.

## Post-deployment report to user
- Deployment success/failure.
- Confirmation that no database tables, RLS policies, schema, secrets, or other Edge Functions changed.
- Confirmation both existing auth paths remain intact.
