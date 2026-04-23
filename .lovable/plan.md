

## Subscription Lifecycle: Grace → Warning → Suspension → Termination + 1-Week Pre-Reminder

Two combined upgrades:

1. **Auto-restrict when subscription/trial expires** (the gap from last response) — implemented via the new 4-stage lifecycle from your image
2. **Fee reminders start 7 days before due date** (not 5)

---

### Part A — Subscription Lifecycle Engine (4 stages from your image)

Today the system has only 2 effective states post-trial (`trial_active` / `trial_expired` → restricted). Razorpay one-time payments have **no auto-expiry job**, so a paid school whose `subscription_renewal_date` passed still appears active. We fix this with a **daily cron** that walks every school and applies the correct lifecycle stage based on days past expiry.

**The 4 stages (`subscription_lifecycle_stage` enum):**

| Stage | Window | Access | What happens |
|---|---|---|---|
| `grace_period` | Days 1–15 past expiry | **Full access** | Auto "Gentle Reminder" emails + WhatsApp on day 1, 7, 14 to school admin; soft yellow banner in app |
| `warning_phase` | Days 16–30 | **Limited (Admin-only, view-mostly)** | Login still works for admins; teachers/accountants see "School subscription expired" page; in-app modal on every admin page; daily emails on day 16, 21, 28 |
| `suspension` | Days 31–89 | **No access** (data safe) | All users land on a "Service Paused" screen; only "Pay Now" + "Contact Support" buttons; data preserved untouched; weekly emails |
| `termination` | Day 90+ | **Deleted** | Marked `terminated_at`; scheduled hard-delete after 30 more days (admin can restore in 30-day window via support); final notice email sent |

**Trial expiry follows the same 4-stage flow** (currently it just goes straight to `trial_expired`). So a school whose 30-day Pro trial ends gets 15 days grace, 15 days warning, then suspension — same UX path as a paid school whose renewal lapses.

**Schema changes:**
```sql
ALTER TYPE school_system_state ADD VALUE 'grace_period';
ALTER TYPE school_system_state ADD VALUE 'warning_phase';
ALTER TYPE school_system_state ADD VALUE 'suspended';
ALTER TYPE school_system_state ADD VALUE 'terminated';

ALTER TABLE schools
  ADD COLUMN expiry_anchor_date date,         -- trial_end_date OR subscription_renewal_date, whichever applies
  ADD COLUMN lifecycle_entered_at timestamptz, -- when current stage started
  ADD COLUMN terminated_at timestamptz,       -- when stage flipped to 'terminated' (for 30-day restore window)
  ADD COLUMN scheduled_purge_at timestamptz;  -- terminated_at + 30 days

CREATE TABLE subscription_lifecycle_logs (
  id uuid pk, school_id, from_stage, to_stage, reason text, created_at
);
```

`get_school_effective_state()` is rewritten to compute the correct stage from `expiry_anchor_date` + today's date. Old `'trial_expired'` and `'restricted_mode'` values stay supported (mapped to `warning_phase` for back-compat).

**The daily cron job** (`process-subscription-lifecycle`):
- Runs daily at 2 AM IST via pg_cron
- For each school: computes correct stage from anchor date, updates `system_state` if changed, writes a row to `subscription_lifecycle_logs`, queues notification emails on transition days (1, 7, 14, 16, 21, 28, 31, 45, 60, 89, 90)
- For `terminated` schools past `scheduled_purge_at` → hard delete (separate function, requires service role)

**Frontend enforcement (extends existing `useSubscriptionStatus` + `RestrictedOverlay`):**

| Stage | UX |
|---|---|
| `grace_period` | Yellow banner: "⏰ Your subscription expired N days ago. {15-N} days of full access remaining. [Renew Now]" — **no feature blocks** |
| `warning_phase` | Red banner + dismissible modal on each admin login: "Limited access mode — renew within {30-N} days to avoid suspension". Teachers/Accountants → full lock screen |
| `suspended` | Hard lock screen at app shell level (above router): "Service Paused — your data is safe. [Pay Now] [Contact Support]". No navigation possible |
| `terminated` | "Account Terminated — data scheduled for deletion on {date}. [Contact Support to Restore]" |

**Renewal flow:** Existing `verify-razorpay-payment` and `payments-webhook` already update `subscription_renewal_date` + flip to `subscription_active`. We add one line: also clear `terminated_at` / `scheduled_purge_at`, set new `expiry_anchor_date`, log the transition.

---

### Part B — 1-Week Advance Fee Reminder (parent-facing)

Tiny change to the existing `send-fee-reminders` edge function:

**Today** it checks 3 dates: `+5 days`, `today`, `yesterday`.

**New schedule** matching your "Gentle Reminder" cadence:
- **−7 days** ("📅 Friendly reminder: ₹X for {student} is due in 1 week on {date}")
- **−3 days** ("⏰ Reminder: ₹X for {student} is due in 3 days")
- **due day** ("⚠️ ₹X for {student} is due today")
- **+1 day overdue** ("🔴 ₹X for {student} is overdue")
- **+7 days overdue** ("🔴 Final reminder: ₹X for {student} is 1 week overdue")

`fee_reminder_logs.reminder_type` enum is extended: `before_7d | before_3d | on | after_1d | after_7d` (existing `before` rows back-compat → treated as `before_5d`, no resend). Existing dedup-per-installment-per-type prevents duplicates.

Cron (already runs daily at 8 AM IST) is unchanged — same job now sweeps 5 dates instead of 3.

---

### Files

**New:**
- `supabase/migrations/<ts>_subscription_lifecycle.sql` — enum extension, schools columns, lifecycle logs table, rewritten `get_school_effective_state()`, helper `compute_lifecycle_stage(anchor_date)`
- `supabase/functions/process-subscription-lifecycle/index.ts` — daily walker + email queuer + purge runner
- `src/components/admin/SuspendedScreen.tsx` — full-screen lock for `suspended` / `terminated` stages
- `src/components/admin/LifecycleBanner.tsx` — replaces `TrialBanner`, handles all 4 stages with countdowns
- `src/hooks/useLifecycleStage.ts` — thin wrapper over `useSubscriptionStatus` exposing stage + days remaining + UX hints
- `supabase/functions/_shared/lifecycle-emails.ts` — templates: gentle-reminder, warning, suspension, final-notice

**Modified:**
- `supabase/functions/send-fee-reminders/index.ts` — 5-date sweep + new templates
- `supabase/functions/verify-razorpay-payment/index.ts` + `payments-webhook/index.ts` — clear lifecycle fields on successful renewal, set new `expiry_anchor_date`
- `src/hooks/useSubscriptionStatus.ts` — return new `lifecycleStage`, `daysIntoExpiry`, `daysUntilNextStage`
- `src/App.tsx` — top-level guard: if stage is `suspended` or `terminated`, render `SuspendedScreen` instead of routes (admins get an exception with limited shell)
- `src/components/admin/AdminLayout.tsx` — mount `LifecycleBanner` (replaces `TrialBanner`)
- Cron schedule (one-off SQL via insert tool, not migration): daily 2 AM IST → `process-subscription-lifecycle`

### Safety / Non-breaking

- Existing `trial_active` / `subscription_active` schools — **untouched**; they never enter the lifecycle states
- `restricted_mode` rows currently in DB → migration backfills `expiry_anchor_date` from `trial_end_date` and lets the cron compute the correct stage on next run
- Hard-delete (`termination → purge`) is gated by a 30-day `scheduled_purge_at` window AND requires a separate manual confirmation from a Platform Admin; cron only **schedules** the purge, never auto-deletes data without that 30-day buffer
- Email/WhatsApp transitions are idempotent — `subscription_lifecycle_logs` prevents resends
- All new emails go through existing `send-transactional-email` infrastructure
- Fee reminder change is additive — existing `before` logs are honored, no parents get a sudden flood

### Acceptance

- Trial ends → next 2 AM cron flips school to `grace_period`; admin sees yellow banner "15 days full access remaining"; "Gentle Reminder" email arrives same day
- Day 16 → flips to `warning_phase`; admin sees red modal; teachers/accountants get locked out
- Day 31 → flips to `suspended`; entire app shell shows "Service Paused" screen for everyone
- Day 90 → flips to `terminated`; `scheduled_purge_at` set to day 120
- Admin renews on day 20 → school flips to `subscription_active`, all banners gone, no data lost
- Fee due in 7 days → parent gets "due in 1 week" WhatsApp; same parent gets 3-day reminder, day-of, +1, +7 overdue — never duplicates

