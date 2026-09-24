# timetable-api Edge Function (read-only time slots)

## What gets built
One new backend function, `timetable-api`, with a single read-only GET endpoint that returns a school's time slots for one academic year. Nothing else changes.

## Behaviour
- `GET /timetable-api?school_id=<uuid>&academic_year_id=<uuid>`
- No or invalid sign-in token: **401**
- Missing or malformed `school_id` / `academic_year_id`: **400**
- Signed-in user not authorized for that school: **403** (the same response whether the school exists or not)
- Any method other than GET or OPTIONS: **405**
- Success: **200**
```json
{ "school_id": "...", "academic_year_id": "...", "time_slots": [ { "id", "school_id", "academic_year_id", "weekday", "period_number", "start_time", "end_time", "is_active" } ] }
```

## Authorization (existing EdZen AI model)
The function uses the caller's own token, so all checks run under the caller's permissions and the existing row-level rules:
1. Check the token server-side (`auth.getClaims`) to get the user id.
2. Call the existing `get_user_school_ids()` and `get_teacher_school_ids()` functions as the caller. Between them these already cover school admins, active school staff, and platform admins (managed-school access). The requested `school_id` must be in the combined list, otherwise 403. The `school_id` sent in the request is only compared against this list and is never trusted on its own.
3. Query `timetable_time_slots` as the caller, filtered by both ids and sorted by weekday, then period_number. The existing timetable row-level rules act as a second layer of protection.

## Security
- No service-role key. The function uses only the public anon key plus the caller's token.
- No secrets, credentials or database details appear in any response. Errors return generic messages, and details are only written to the function logs.
- CORS uses the standard shared headers from the SDK.

## Out of scope
No generation, publishing, Python connection, or writes. Existing tables, policies, functions and app code are not touched, and `supabase/config.toml` is not edited.

## Technical details
- New file: `supabase/functions/timetable-api/index.ts` (Deno, `npm:@supabase/supabase-js@2`, `corsHeaders` from `npm:@supabase/supabase-js@2/cors`, zod UUID validation).
- Deploy with the deploy tool, then test with curl: no token gives 401, a bad id gives 400, another school gives 403, and your own school gives 200 with slots in order.
- Endpoint: `https://fwnvfkaihuqdfdcwkakj.supabase.co/functions/v1/timetable-api`
