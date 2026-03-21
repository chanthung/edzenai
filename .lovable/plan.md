

# Google OAuth Signup Flow — School Onboarding for New Users

## Problem

When a new user signs in via Google on `/login`, they get authenticated but have no school, no role, and no plan. The current redirect logic falls through to `/admin` which breaks.

## Solution

Create a **post-OAuth onboarding page** at `/onboard` that catches new Google users who have no school linked, and walks them through school creation + plan selection.

## Flow

```text
/login → "Continue with Google" → Google OAuth → callback to /login
  → useEffect checks roles:
      - Has role? → redirect to dashboard as usual
      - No role? → redirect to /onboard (NEW)
          → Step 1: School Name, Phone (name/email from Google profile)
          → Step 2: Plan Selection (same UI as /signup step 2)
          → Calls edge function → redirect to /admin
```

## Implementation Steps

### 1. Create Onboarding Page: `src/pages/auth/Onboard.tsx`

- Pre-fill admin name and email from `user.user_metadata.full_name` and `user.email`
- Collect: School Name, Phone (admin name editable but pre-filled)
- Step 2: Plan selection cards (reuse same UI pattern from Signup.tsx)
- On submit: call a new edge function `onboard-school` that creates the school for an **already authenticated** user (unlike `signup-school` which creates the user too)

### 2. New Edge Function: `supabase/functions/onboard-school/index.ts`

Accepts: `schoolName`, `adminName`, `phone`, `selectedPlan`  
Requires auth (uses JWT to identify user). Logic:
- Gets user ID from JWT
- Updates user metadata (full_name, phone) if provided
- Creates school record with trial settings (same as signup-school)
- Links user → school_admins, adds school_admin role
- Creates default fee categories
- Returns school ID

### 3. Update Login.tsx redirect logic

Change the fallback case (no role found) from `navigate("/admin")` to `navigate("/onboard")`.

### 4. Add Route

Register `/onboard` in `App.tsx`.

### 5. Config

Add `[functions.onboard-school]` with `verify_jwt = false` to config.toml (JWT validated in code).

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/auth/Onboard.tsx` | Create — post-OAuth school setup |
| `supabase/functions/onboard-school/index.ts` | Create — authenticated school creation |
| `src/pages/auth/Login.tsx` | Modify — redirect no-role users to `/onboard` |
| `src/App.tsx` | Modify — add `/onboard` route |
| `supabase/config.toml` | Modify — add onboard-school function config |

