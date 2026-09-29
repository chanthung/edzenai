# Add engine-only POST to timetable-api

Small additive change to `supabase/functions/timetable-api/index.ts`. Nothing else is touched: no database, security rules, secrets, frontend, or other functions.

## What stays exactly the same
- OPTIONS preflight and CORS headers (already allow `x-timetable-engine-secret`).
- GET: validation, engine-secret path, signed-in path, and every read function.
- `secretMatches()` constant-time comparison.

## What is added
1. Method gate changes from "not GET → 405" to "not GET and not POST → 405". GET flows into the unchanged existing code.
2. New `handleEnginePost(req)`, run before any GET logic:
   - Missing `X-Timetable-Engine-Secret`, missing `TIMETABLE_ENGINE_SECRET`, or mismatch → 401. There is no fallback to the signed-in browser path.
   - Invalid JSON → 400.
   - Zod body schema:
     - `school_id`, `academic_year_id`: uuid
     - `entries`: non-empty array of `{ class_name: string(min 1), section: string(min 1), time_slot_id: uuid, subject_id: uuid, teacher_id: uuid|null (optional), room_id: uuid|null (optional), elective_group: string|null (optional) }`
     - `notes`: string|null (optional)
     - Invalid → 400 with field errors.
   - Service-role client built from `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` inside the function only.
   - `rpc("create_timetable_run", { _school_id, _academic_year_id, _entries, _notes })`. Entries are passed through as-is, with no ID changes.
   - RPC error: logged on the server. Postgres data/constraint errors (codes starting with 22 or 23, or raised P0001) → 400 `{ error: "Invalid timetable data" }`. Anything else → 500 `{ error: "Internal error" }`. No database details are returned.
   - Success: take the first row and return 200 `{ success: true, run_id, status, entries_created }`.

## Verification
- Confirmed: `public.create_timetable_run(_school_id uuid, _academic_year_id uuid, _entries jsonb, _notes text)` returns `TABLE(run_id, status, entries_created)`.
- Deploy, then run live checks: GET still returns 200 with the same 11 arrays. POST with no secret → 401. POST with a wrong secret → 401. POST with a Bearer token only → 401. PUT → 405.
- A successful POST can't be tested live because the secret value is hidden. Check the build for type errors and report them.
- Report the exact diff and the requested confirmations.
