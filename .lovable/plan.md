# Fix Plan-Banner Mismatch on Dashboard

## Root Cause

The Settings page (₹7/student), Platform Admin (Starter badge), and the `Starter Plan` chip on the dashboard banner are all **correct** — Delhi Public School is genuinely on the Starter plan in the database:

```
subscription_plan: starter
system_state:     trial_active
trial_end_date:   null
payment_verified: false
```

The lie is in **one component**: `src/components/admin/TrialBanner.tsx`. Lines 46–50 hardcode the headline to:

> "🚀 You are on Pro Trial (Expires today)"

…regardless of `currentPlan`. So a Starter school in `trial_active` state sees a "Pro Trial" headline, while every other surface correctly shows Starter / ₹7. There is no data desync — only a copy bug in the banner.

A secondary issue: when `trial_end_date` is `null` the banner falls back to "(Expires today)", which is misleading. Starter has no trial concept at all (per `Onboard.tsx`: "Your Starter plan is active"), so for Starter schools the banner should not present itself as a countdown at all.

## What to Change

**Single file edit:** `src/components/admin/TrialBanner.tsx`

Branch the headline + sub-copy + CTA on `currentPlan`:

1. **Pro plan, trial active** → keep current copy:
   - "🚀 You are on Pro Trial (N days left / Expires today)"
   - Sub-line: "Full Pro access included" + plan badge
   - CTA: `Upgrade Now` → `/pricing`

2. **Starter plan, trial active** → new copy:
   - "✨ You're on the Starter plan"
   - Sub-line: "Upgrade to Pro to unlock AI insights, report cards, and advanced analytics."
   - CTA: `Upgrade to Pro` → `/pricing`
   - No "expires today" / countdown text (Starter has no trial expiry).

3. **Trial expired / restricted** (existing branch) → leave logic as-is, it already reads `currentPlan` correctly.

4. **Edge case** — if `currentPlan === 'pro'` but `daysRemaining` is `null` (no trial_end_date set), render "Pro Trial Active" without the misleading "(Expires today)" suffix.

## Files Touched

- Edit: `src/components/admin/TrialBanner.tsx` (only)

## What Stays the Same

- `useSubscriptionStatus` — already returns `currentPlan` correctly.
- `SubscriptionInfoCard` (Settings) — already correct.
- Platform Admin Edit dialog — already correct.
- Pricing page — already aligned (previous task).
- DB schema and `schools` row — no migration needed.

## Out of Scope

Not changing trial-state semantics in the DB or hook. The bug is purely cosmetic copy in one banner; everything downstream already agrees on Starter / ₹7.
