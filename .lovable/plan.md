# Platform Admin: Manage Any School

Goal: from the Platform Admin dashboard, click **Manage** on any school row and land in the normal school admin dashboard for that school with full read/write, then exit back to Platform Admin.

## Why this approach

Today every school-scoped permission rule in the database funnels through one helper (`get_user_school_ids()`), which returns only the schools where you are listed as an admin. Every table's rules already call it. So instead of rewriting dozens of rules or duplicating admin screens, we make that single helper also return **all** schools when the signed-in user is a platform admin.

Result: no changes to any table rules, no changes to any existing feature screen — the whole admin app just works for you on whichever school you select.

## What you'll see

1. Platform Admin table gets a **Manage** action on each school row.
2. Clicking it opens the standard admin dashboard scoped to that school.
3. A slim top banner shows `Managing: <School Name>` with an **Exit to Platform Admin** button.
4. The selection persists across page refreshes until you exit.

## Technical changes

**Database (1 migration)**
- Redefine `public.get_user_school_ids()` so it returns every `schools.id` when `public.is_platform_admin()` is true, otherwise its current behaviour (schools from `school_admins`). Security-definer + `search_path = public` retained.
- No policy, grant, or table changes.

**Frontend (minimal, additive)**
- New `src/contexts/ManagedSchoolContext.tsx`: holds the selected school id, persisted in `localStorage` (`edzen.managedSchoolId`), only meaningful for platform admins. Provider mounted in `src/App.tsx`.
- `src/hooks/useSchool.ts`: single change — when a managed school id is set, query `.eq('id', managedId)` instead of `.limit(1)`. All other hooks derive their school from `useSchool()`, so they need no edits.
- `src/pages/platform/PlatformDashboard.tsx`: add a **Manage** icon button per row that sets the managed school and navigates to `/admin`.
- New `src/components/admin/ManagedSchoolBanner.tsx`: the "Managing X / Exit" bar, rendered inside `AdminLayout` above the existing lifecycle banner (one added line).
- Route guard: `AdminLayout` currently allows any signed-in user; a platform admin without a managed school selected is redirected back to `/platform`.

**Not changed**: RLS policies, existing hooks/pages other than the three touch points above, accountant/teacher/parent flows.

## Notes

- Lifecycle locks (suspended/blocked schools) still apply while managing; if you want platform admin to bypass those screens, say so and I'll add that exemption.
- Actions you take while managing are recorded with your user id (e.g. `recorded_by`), which keeps an audit trail.
