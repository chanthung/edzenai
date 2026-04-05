

## Plan: Auto WhatsApp Fee Reminders + Share Button on Student-wise Fee Report

### Feature 1: Automated WhatsApp Fee Reminders (5 days before, on, and after due date)

This requires a scheduled/cron Edge Function that runs daily, checks all installments with upcoming or overdue due dates, and sends WhatsApp reminders to parents.

**New Edge Function: `send-fee-reminders`**
- Runs on a daily cron schedule (via `pg_cron` or Supabase cron in config.toml)
- Queries all unpaid installments where:
  - `due_date = today + 5 days` → "Reminder: ₹X for {{studentName}} is due on {{date}}"
  - `due_date = today` → "⚠️ ₹X for {{studentName}} is due today"
  - `due_date = today - 1 day` (just passed) → "🔴 ₹X for {{studentName}} is overdue"
- For each match, fetches student's parent_phone, builds parent link, sends WhatsApp via Mayavi API
- Skips students without phone numbers
- Logs results for debugging

**Database: New `fee_reminder_logs` table** to prevent duplicate messages:
- Columns: `id`, `student_id`, `installment_id`, `reminder_type` (before/on/after), `sent_at`
- Before sending, check if reminder already sent for this installment + type combo

**Config: `supabase/config.toml`** — add cron schedule for the function (daily at 8 AM IST / 2:30 AM UTC)

### Feature 2: Share Button + Multi-select on Student-wise Fee Report

**File: `src/components/admin/reports/StudentPendingReport.tsx`**
- Add a checkbox column for multi-selection (same pattern used in Students page for bulk parent link sharing)
- Add "Select All" checkbox in header
- Add a "Share via WhatsApp" button in the toolbar that:
  - Shows count of selected students
  - Opens confirmation dialog listing recipients
  - Sequentially invokes `send-parent-link` edge function for each selected student (with 500ms throttle)
  - Shows progress bar during sending
- Only enabled when `statusFilter` shows pending students

**File: `src/hooks/useFeeReports.ts`**
- Add `parentPhone` and `accessToken` fields to `StudentFeeReport` interface so the report component has the data needed for sharing

### Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/send-fee-reminders/index.ts` | New — daily cron function for automated reminders |
| `supabase/config.toml` | Add cron schedule for send-fee-reminders |
| Database migration | New `fee_reminder_logs` table to prevent duplicate sends |
| `src/hooks/useFeeReports.ts` | Add `parentPhone`, `accessToken` to StudentFeeReport |
| `src/components/admin/reports/StudentPendingReport.tsx` | Add checkboxes, select all, share button with progress |

### Technical Details

- The cron function uses `SUPABASE_SERVICE_ROLE_KEY` (not user auth) since it runs unattended
- Reminder messages include the parent link for quick access
- The multi-select share reuses the existing `send-parent-link` edge function and bulk-sharing pattern from the Students page
- Fee reminder logs use a unique constraint on `(student_id, installment_id, reminder_type)` per academic period to prevent spam

