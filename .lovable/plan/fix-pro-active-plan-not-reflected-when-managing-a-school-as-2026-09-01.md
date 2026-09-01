# Fix: Pro/Active plan not reflected when managing a school as Platform Admin

## What's actually wrong (verified)

Two separate bugs, both confirmed by reading the code and the live data.

1. **The plan/status shown inside "Manage this school" comes from the wrong school.**
   `useSubscriptionStatus` reads the schools table with `.limit(1)` and no school
   filter. Since Platform Admin can now see all 8 schools, it picks whichever row the
   database returns first — not the school you clicked Manage on. That's why the sidebar
   showed "Starter / Active" while managing Mount Sinai. Every plan gate (Student Progress
   lock, Pro badges, restricted mode) reads from this hook, so they are all wrong too.

2. **Edit School saves the plan but not the state.** Its `computeSystemState()` requires
   `school.payment_verified` to already be true — and that dialog never sets it. So choosing
   Status = Active writes `subscription_status = 'active'` while `system_state` stays
   `trial_active` and `payment_verified` stays false. Current rows confirm this:

   | School | plan | status | system_state | payment_verified |
   |---|---|---|---|---|
   | Mount Sinai School | pro | active | trial_active | false |
   | Eden Higher Secondary School | pro | trial | trial_active | false |

## Fix

1. **Scope subscription status to the managed school** — in `useSubscriptionStatus`,
   apply the same `managedSchoolId` filter `useSchool` already uses, and add it to the
   query key. One hook, no behaviour change for normal school admins (no managed id set).

2. **Make Edit School's state computation honest** — base `computeSystemState()` on the
   status selected in the form, and write `payment_verified` accordingly, so saving
   Status = Active actually produces `subscription_active`.

3. **Correct the two existing rows** so both schools are Pro + Active with full access
   (`subscription_status = 'active'`, `system_state = 'subscription_active'`,
   `payment_verified = true`). Done via the admin dialog after fix 2, or a one-off data
   update — no schema change.

## Scope / rollback

Only two files touched (`src/hooks/useSubscriptionStatus.ts`,
`src/components/platform/EditSchoolDialog.tsx`) plus a data correction for the two schools.
No schema migration, no changes to any other screen, hook, or policy — so this is a clean
single-step rollback point.

## Verification

While managing Mount Sinai and Eden: sidebar shows **Pro / Active**, Student Progress is
unlocked, no trial or restricted banner. Exiting to your own view and normal school-admin
logins are unaffected.
