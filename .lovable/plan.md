## Problem

The "Upgrade Now" button on the school dashboard (`TrialBanner`) routes the user to `/pricing`. That page initializes its student-count slider with a hard-coded `**useState(100)**` — the user is asked to type the count again, which:

1. Doesn't match what `Settings → Subscription` shows (that card uses `select count from students where school_id = …` and shows the real number, e.g. **37 Active Students**).
2. Doesn't match the actual roster from the **Students** module.
3. Lets the school under-pay or over-pay (in your example: paid ₹200 for 20 students even though the school actually has more on file).
4. Is then sent as `quantity` to Paddle / `studentCount` to Razorpay, so the **wrong number is locked into the subscription** at the gateway too.

There is no single source of truth — three places (Pricing slider, SubscriptionInfoCard, checkout payload) each calculate independently.

## Goal

Wherever the school is logged in and triggering an upgrade/checkout, the student count must be **auto-derived from the `students` table for their school**, displayed read-only (with a clear note), and passed through to Razorpay/Paddle so billing matches reality. The marketing/public version of `/pricing` (no logged-in school) keeps the editable slider for browsing.

## Scope of Changes

### 1. New shared hook: `useSchoolStudentCount`

File: `src/hooks/useSchoolStudentCount.ts` (new)

- Resolves the current user's `school_id` (via `useSchool`).
- Returns `count` from `students` table using `{ count: 'exact', head: true }` — same query already used by `SubscriptionInfoCard`.
- React Query cached, invalidated on student CRUD (reuse the existing `students` query key invalidations).
- Returns `{ count, isLoading }`.

This becomes the single source of truth used by `SubscriptionInfoCard`, `Pricing`, and any future billing UI.

### 2. `src/pages/Pricing.tsx` — auto-fill + lock for logged-in schools

- Replace the hard-coded `useState(100)` with logic:
  - If `user && school` → initialize `students` from `useSchoolStudentCount` and **disable** the slider + input. Do NOT disable but they cannot slide less than total no of students in the schools database.
  - If anonymous (marketing visit) → keep current editable slider (default 100).
- When count is auto-filled, replace the helper text "Drag or type to see your monthly cost" with:
  > "Based on your current roster of N students from the Students module."
  > Plus a small link: "Manage students →" pointing to `/admin/students`.
- Remove the silent `Math.max(students, 10)` floor in `handlePayViaUPI` / `handlePayViaCard`. Instead:
  - If real count < 10 (the gateway minimum), show an inline notice explaining the minimum-billable quantity is 10 and the school will be billed for 10.
  - Pass `Math.max(realCount, 10)` only after the user is told.
- If `studentCount === 0`, disable checkout buttons with tooltip "Add students before subscribing."

### 3. `SubscriptionInfoCard.tsx` — switch to shared hook

- Replace its inline `useQuery(['student-count'…])` with `useSchoolStudentCount()` so Settings page and Pricing page can never disagree.
- Behavior unchanged for the user.

### 4. `TrialBanner.tsx` — pass intent through

No code change required to the link target — `/pricing` already handles the auto-fill once #2 lands. (Optional polish: append `?source=upgrade` for analytics; skip if not needed.)

### 5. Edge cases handled

- **Marketing visitor** (no auth) → unchanged editable slider.
- **Logged-in school, 0 students** → checkout disabled with CTA to add students first.
- **Logged-in school, <10 students** → bill for 10 (gateway minimum), shown clearly.
- **Logged-in school adds/removes students later** → React Query invalidation already exists on students mutations; the displayed count and billing recalculate automatically.
- **Future: per-class active filter** — out of scope. Currently `SubscriptionInfoCard` counts ALL rows in `students`. We keep parity with that exact query so the two screens always match. If you later want "active enrollments only", we change it in one place (`useSchoolStudentCount`).

## Files Touched

- **New**: `src/hooks/useSchoolStudentCount.ts`
- **Edit**: `src/pages/Pricing.tsx` — auto-fill + lock + UX copy + zero-student guard
- **Edit**: `src/components/admin/SubscriptionInfoCard.tsx` — use shared hook

## Out of Scope

- Reconciling already-paid subscriptions where quantity is wrong at the gateway (would require Paddle/Razorpay subscription updates — flag separately if you want this).
- Changing volume-discount tier logic.
- Adding a "billable students" concept distinct from total roster.

## Result

After this change: clicking **Upgrade Now** from the dashboard takes the school to `/pricing` with the student count already showing **37** (matching Settings → Subscription, matching the Students module), the slider is locked, the displayed monthly fee matches the Settings card to the rupee, and the checkout sent to Paddle/Razorpay carries the same 37 — no more drift between roster, billing UI, and gateway.