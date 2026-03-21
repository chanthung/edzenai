

# School Self-Signup Flow with Trial + Plan Selection

## Overview

Create a 2-step self-signup flow: Basic Info → Plan Selection → auto-create school with 30-day trial. No platform admin needed for self-registration.

## Architecture

```text
/signup (Step 1: Info) → /signup (Step 2: Plan) → Edge Function → /admin (Dashboard with trial banner)
```

## Implementation Steps

### 1. Edge Function: `signup-school`

New backend function at `supabase/functions/signup-school/index.ts` that:
- Accepts: schoolName, adminName, email, phone, password, selectedPlan
- Creates user via `supabase.auth.admin.createUser()` (email auto-confirmed)
- Creates school record with: `subscription_plan`, `subscription_status = 'trial'`, `trial_start_date = now`, `trial_end_date = now + 30 days`, `system_state = 'trial_active'`
- Links user → school via `school_admins` (is_primary = true)
- Adds `school_admin` role to `user_roles`
- Creates default fee categories (same as existing `create-school` function)
- Returns success with school ID
- **No auth required** (public endpoint) — uses service role key internally

### 2. Signup Page: `src/pages/auth/Signup.tsx`

Two-step form within a single page component:

**Step 1 — Basic Info:**
- School Name, Admin Name, Email, Phone, Password (all required)
- Trust badges: "No credit card required", "Free for 30 days"
- "Next" button → advances to Step 2

**Step 2 — Plan Selection:**
- Two cards side-by-side: Starter (₹5/student) and Pro (₹8/student, "Recommended" badge)
- Feature bullet list from existing `PLAN_DISPLAY` config
- Default selection = Starter
- "Start Free Trial" button → calls edge function, signs in user, redirects to `/admin`

### 3. Update Login Page

Add "Start Free Trial" CTA button below the sign-in card linking to `/signup`.

### 4. Update Landing Page

- Change hero CTA to "Start Free Trial" (primary) + keep "Sign In" (secondary)
- Update bottom CTA section similarly

### 5. Add Route

Register `/signup` route in `App.tsx`.

### 6. Trial Banner on Dashboard

Add a banner component to `src/pages/admin/Dashboard.tsx` that shows:
- "Your 30-day free trial has started" (for new trial users)
- Days remaining countdown
- Upgrade CTA for Starter plan users

This leverages the existing `useSubscriptionStatus` hook which already computes `effectiveState`, `daysRemaining`, and `currentPlan`.

## Technical Details

- The edge function mirrors the existing `create-school` function's logic but removes the platform admin check, making it a public self-service endpoint
- After successful signup, the client calls `supabase.auth.signInWithPassword()` to establish session, then redirects
- Input validation: email format, password min 6 chars, required fields — both client-side (zod) and server-side
- The existing subscription/trial system handles expiry automatically (no new DB changes needed)
- No database migration required — all needed columns already exist on the `schools` table

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/signup-school/index.ts` | Create — public school registration endpoint |
| `src/pages/auth/Signup.tsx` | Create — 2-step signup form |
| `src/components/admin/TrialBanner.tsx` | Create — trial status banner |
| `src/pages/auth/Login.tsx` | Modify — add "Start Free Trial" link |
| `src/pages/Index.tsx` | Modify — add trial CTA buttons |
| `src/App.tsx` | Modify — add `/signup` route |
| `src/pages/admin/Dashboard.tsx` | Modify — add TrialBanner component |

