## Goal

Let each school control its own WhatsApp fee reminder behavior from the Fee Setup page, instead of using the current hardcoded settings (08:00 IST, all 5 offsets always on, fixed templates).

## What admins will be able to configure

In a new **Reminder Settings** section on the Fee Setup page:

1. **Master switch** — turn fee reminders on/off for the whole school.
2. **Send time** — pick the hour of day (IST) reminders go out. Single hour per day (e.g. 9 AM, 6 PM).
3. **Which reminders to send** — independent toggles for each of the 5 offsets:
   - 7 days before due
   - 3 days before due
   - On the due date
   - 1 day after due (overdue)
   - 7 days after due (final)
4. **Custom message templates** — editable WhatsApp text per reminder type with placeholders `{amount}`, `{studentName}`, `{dueDate}`, `{parentLink}`, `{schoolName}`. Each row also shows a live preview and a "Reset to default" button.

A "Send test reminder to my number" button lets admins fire off a sample WhatsApp message before going live.

## UI

New collapsible card at the top of `/admin/fee-setup`, above the existing Fee Structures / Categories tabs:

```text
┌─ WhatsApp Fee Reminders ──────────────────── [● Enabled] ─┐
│ Send daily at: [09:00 ▼] IST                              │
│                                                            │
│ Reminders to send:                                         │
│  [✓] 7 days before due   [Edit template]                   │
│  [✓] 3 days before due   [Edit template]                   │
│  [✓] On due date         [Edit template]                   │
│  [✓] 1 day after due     [Edit template]                   │
│  [✓] 7 days after due    [Edit template]                   │
│                                                            │
│ [Send test to my WhatsApp]            [Save changes]       │
└────────────────────────────────────────────────────────────┘
```

Template editor opens in a dialog with textarea + placeholder chips + preview.

## Technical changes

**New table** `school_reminder_settings` (one row per school):
- `school_id` (PK, FK schools)
- `enabled boolean default true`
- `send_hour_ist int default 8` (0–23)
- `offsets_enabled jsonb` — `{before_7d, before_3d, on, after_1d, after_7d}` booleans
- `templates jsonb` — same keys → string templates (null = use built-in default)
- `updated_at`, `updated_by`

RLS: school admins manage their school's row; service role read for the cron function.

**Edge function `send-fee-reminders`** — read each affected school's settings:
- Skip if `enabled = false`
- Skip offsets where toggle is off
- Use custom template if present, else fall back to built-in default
- Only act when current IST hour matches `send_hour_ist` (compare hour at function start, since cron now runs hourly)

**Cron** — change `daily-fee-reminders` schedule from `30 2 * * *` (single 02:30 UTC tick) to **hourly at :00** (`0 * * * *`). Each school is processed only on its chosen hour. Done via `pg_cron` update.

**New edge function `send-test-fee-reminder`** — admin-only, sends one sample WhatsApp to the caller's chosen test number using the school's `on_due` template with sample data.

**Frontend**:
- New hook `useReminderSettings(schoolId)` — fetch + upsert
- New component `src/components/admin/fees/ReminderSettingsCard.tsx`
- New component `src/components/admin/fees/TemplateEditorDialog.tsx`
- Mounted at top of `src/pages/admin/FeeSetup.tsx`
- Default template constants live in `src/lib/fee-reminder-defaults.ts` (shared shape; edge function has its own copy)

## Migration & backfill

- Create table + RLS
- Backfill one row per existing school with defaults (enabled=true, hour=8, all offsets on, templates=null)
- Update pg_cron schedule for `daily-fee-reminders` to hourly

## Out of scope

- Per-class or per-student overrides
- Multiple send slots per day (you chose single hour)
- SMS / email channels (WhatsApp only, as today)
