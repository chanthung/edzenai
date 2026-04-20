
Replace the parent-link WhatsApp flow with a normalized, provider-tolerant delivery pipeline so numbers are stored consistently and transient provider errors stop being misreported as “invalid number”.

### What to fix

1. **Normalize phone numbers everywhere**
   - Create one shared phone-normalization rule for Indian numbers:
     - strip non-digits
     - remove leading `91` when length is 12
     - remove leading `0` when length is 11
     - store only the final 10-digit local number in `students.parent_phone`
   - Apply that rule in:
     - Add Student form
     - Edit Student dialog
     - Bulk upload editable grid
     - AI Excel import
     - any other student update/create path using `parent_phone`
   - Keep `+91` as display-only UI chrome, never part of stored data.

2. **Backfill existing data across all schools**
   - Add a migration to normalize all existing `students.parent_phone` values to 10 digits.
   - Add a validation trigger on `students` so future inserts/updates are normalized automatically at the database layer.
   - Reject impossible values instead of saving mixed formats.

3. **Harden the `send-parent-link` backend**
   - Move WhatsApp sending logic into a reusable helper in `supabase/functions/_shared/` so all WhatsApp features use the same behavior.
   - Standardize secret lookup to support the project’s current inconsistency (`WA_API_KEY` vs `WHATSAPP_API_KEY`) without breaking existing flows.
   - Normalize the outgoing number before sending.
   - Add:
     - timeout handling
     - 3 retries with backoff
     - structured provider response parsing
   - Only classify a number as invalid when the provider explicitly says the number is invalid / not on WhatsApp.
   - Treat generic messages like “not sent” / “göndərilmədi” as temporary provider failures, not bad-number failures.

4. **Log every dispatch**
   - Update `send-parent-link` to write to `parent_link_dispatches` with:
     - `pending` when send starts
     - `sent` on confirmed success
     - `failed` with `error_message` on final failure
   - Use a service-role client inside the function so logging is reliable and not blocked by RLS.
   - This gives school-level history and makes failures diagnosable instead of guesswork.

5. **Fix frontend failure handling**
   - Update all callers of `send-parent-link` to inspect `response.data.success`, not just transport-level `response.error`.
   - Fix both:
     - `src/pages/admin/Students.tsx`
     - `src/components/admin/reports/StudentPendingReport.tsx`
   - Show better messages:
     - invalid number: ask admin to correct the phone
     - temporary provider failure: “Please retry in a moment”
   - Keep the UI from falsely counting failed sends as success.

### Why this will solve the intermittent issue

The current flow mixes two different problems:
- **data inconsistency** from phone numbers entering the system through multiple paths
- **provider instability** being wrongly labeled as “number not on WhatsApp”

The fix separates those concerns:
- database + UI normalization removes formatting issues across all schools
- stricter provider parsing stops false invalid-number errors
- retry/backoff handles transient failures
- dispatch logging makes the result observable

### Files to update

**Frontend**
- `src/components/admin/EditStudentDialog.tsx`
- `src/pages/admin/Students.tsx`
- `src/components/admin/reports/StudentPendingReport.tsx`
- any student create/edit helpers touching `parent_phone`

**Edge functions**
- `supabase/functions/send-parent-link/index.ts`
- `supabase/functions/_shared/...` new WhatsApp helper
- optionally align:
  - `supabase/functions/send-fee-reminders/index.ts`
  - `supabase/functions/send-payment-confirmation/index.ts`
  - invite WhatsApp helpers
  so all WhatsApp delivery uses the same normalization/parser

**Database**
- new migration in `supabase/migrations/` to:
  - normalize existing `students.parent_phone`
  - add trigger/function for future normalization
  - optionally add stricter validation for phone length

### Acceptance criteria

- A phone saved as `9612159599`, `+91 9612159599`, `919612159599`, or `09612159599` ends up stored as `9612159599`.
- The Edit Student modal still displays `+91` visually, but DB values remain 10 digits only.
- Sending a parent link no longer randomly shows “number not registered” for provider hiccups.
- Temporary WhatsApp outages show a retry-style message.
- Success/failure is logged for every send across all schools.
- Bulk share and report share counts match actual delivery results.
