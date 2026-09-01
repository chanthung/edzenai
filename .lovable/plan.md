# Add "Continue with Google" to Start Free Trial (Signup)

Yes — it is safe. The plumbing already exists: a Google user who has no school yet is sent to `/onboard`, which collects School Name, City, State, Phone and plan, then calls the same `onboard-school` function the email signup uses. Nothing about trial creation, billing, or school isolation changes.

## What changes

Add a Google button at the top of Step 1 of the signup page, matching the login page exactly:

- "Continue with Google" button with the Google logo, above an "OR CONTINUE WITH EMAIL" divider.
- Uses the same `signInWithOAuth('google')` from the auth context as the login page.
- Loading spinner state and error toast, same as login.

## Plan selection carry-over

Signup reads `?plan=pro|starter` from the URL. Before starting the Google flow, store that choice (sessionStorage) so `/onboard` pre-selects the same plan the user clicked from the pricing/home page instead of always defaulting to Pro. The user can still change it on the Choose Plan step.

## Flow after clicking Google

1. Google sign-in completes and returns to `/login`.
2. The existing role redirect finds no school for the new user and sends them to `/onboard`.
3. School Info -> Choose Plan -> trial starts -> `/admin/getting-started`.

Existing users who click Google on the signup page simply land on their own dashboard — no duplicate school is created.

## Technical notes

- Files touched: `src/pages/auth/Signup.tsx` only (plus reading the stored plan in `src/pages/auth/Onboard.tsx`).
- No database, RLS, or edge function changes.
- Email/password signup remains unchanged and default-visible.
