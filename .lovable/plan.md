

# Guided Onboarding Flow for New Schools

## Current State

- **Signup** (`/signup`): Collects school info + plan, creates auth user, sends verification email.
- **Onboard** (`/onboard`): For Google OAuth users without a school -- collects school name, admin info, plan, then calls `onboard-school` edge function.
- **Login** (`/login`): After verification, auto-creates school from signup metadata via `onboard-school`, then redirects to `/admin`.
- **Dashboard** (`/admin`): Shows a setup checklist but drops users into an empty dashboard with no guided flow for adding students.

**Problem**: After school creation, users land on an empty dashboard with no guidance to reach activation (adding students).

## Plan

### 1. Create a new guided onboarding page (`/admin/getting-started`)

A new page `src/pages/admin/GettingStarted.tsx` with a 4-step card-based wizard:

**Step 1 -- Welcome**
- "Welcome to EdZen AI" heading
- "Let's set up your school in 2 minutes" subtitle
- "Get Started" CTA button

**Step 2 -- School Config** (classes, sections, academic year)
- Multi-select for classes (pre-school through Class 12)
- Section input (A, B, C chips)
- Academic year auto-filled from existing active year (read-only confirmation)
- This step saves nothing new to DB -- it primes the student import step with class/section context

**Step 3 -- Add Students** (activation step)
- Two prominent options: "Upload Excel" (primary, highlighted) and "Add Manually"
- Excel upload reuses `BulkStudentUpload` component (opened as dialog)
- Manual add links to `/admin/students` with a "come back" note
- Helper text: "Upload your student list to get started quickly"
- Skip button visible but de-emphasized

**Step 4 -- Success + AI Preview**
- "Students added successfully" confirmation with count
- Sample AI insight preview cards (static/illustrative):
  - "3 students may need attention in Math"
  - "Class performance trends available"
- "Go to Dashboard" CTA button

**Progress indicator** at the top: step dots showing "Step X of 4"

### 2. Add onboarding status tracking

- Add a `schools` column `onboarding_completed` (boolean, default false) via migration
- Set to `true` when user completes step 4 or explicitly skips
- No separate tracking table needed -- the column is sufficient

### 3. Redirect logic changes

**In Login.tsx** (line ~90): After successful school creation, redirect to `/admin/getting-started` instead of `/admin`.

**In Onboard.tsx** (line 59): After `onboard-school` success, redirect to `/admin/getting-started` instead of `/admin`.

**In Dashboard.tsx**: On mount, check if `school.onboarding_completed === false` AND students count is 0 -- if so, redirect to `/admin/getting-started`.

### 4. Route registration

Add `/admin/getting-started` route in `App.tsx`.

### 5. Skip and exit handling

- "Skip" button visible on steps 2-3, sets `onboarding_completed = true` and goes to dashboard
- Completing step 4 sets `onboarding_completed = true`
- Users who already have students skip directly to step 4 or dashboard

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/GettingStarted.tsx` | Create -- full wizard page |
| `src/App.tsx` | Add route |
| `src/pages/auth/Login.tsx` | Change redirect target |
| `src/pages/auth/Onboard.tsx` | Change redirect target |
| `src/pages/admin/Dashboard.tsx` | Add redirect guard |
| DB migration | Add `onboarding_completed` column to `schools` |

## Technical Notes

- The wizard reuses existing `BulkStudentUpload` component for Excel import
- `AdminLayout` wraps the page for consistent nav
- Step 2 class/section selections are passed as props to the student import dialog
- The `onboarding_completed` flag is updated via a simple Supabase update call (existing RLS allows school admins to update their own school)
- No edge function needed -- all logic is client-side with existing hooks

