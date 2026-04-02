
I inspected the current flow and the main problem is not Cloudflare itself.

What I found

1. In `src/components/platform/EditSchoolDialog.tsx`, the “Email Reset Link” button sends the reset to `formData.email`, which comes from `schools.email`.
2. In `supabase/functions/create-school/index.ts`, the actual login account is created with `adminEmail`, and that email is not stored in the public school record. The public data only stores the relationship in `school_admins (user_id, school_id, is_primary)`.
3. So right now, Platform Admin is often sending the reset to the school’s contact email, not the real school admin login email.
4. The reset page itself is already in place and valid (`/reset-password` exists), so the issue is before the user ever receives the email.
5. Separately, the sender domain for auth email is still not active in the backend email setup. The current status for `notify.edzenai.com` is still pending. So Cloudflare showing the root domain as active does not yet mean password reset emails are configured to send from `support@edzenai.com`.

Plan

1. Fix the reset target
   - Replace the current client-side reset call in `EditSchoolDialog` with a platform-admin-only backend action.
   - That backend action should:
     - verify the caller is a platform admin,
     - find the school’s primary admin via `school_admins`,
     - resolve that admin’s real login email from the auth system,
     - send the password reset to that exact account.

2. Fix the Edit School UI
   - Update the reset section so it clearly says it sends to the primary school admin login.
   - Show the resolved admin login email in the dialog as a separate read-only field.
   - Keep `School Email` as the school contact email only.

3. Prevent future confusion in school setup
   - Make the labels more explicit in create/edit flows:
     - `School Contact Email`
     - `Admin Login Email`
   - This keeps billing/contact email and login email clearly separate.

4. Finish branded auth email setup
   - Complete the email sender activation for `notify.edzenai.com` in Lovable Cloud.
   - Once active, wire auth emails to use the branded sender so resets can come from `support@edzenai.com` instead of the default sender.

5. Verify end-to-end
   - Test with a school where contact email and admin login email are different.
   - Test with a school where they are the same.
   - From Platform Admin: open Edit School → send reset → receive email → open `/reset-password` → set new password → sign in successfully.

Technical details

- Files directly involved:
  - `src/components/platform/EditSchoolDialog.tsx`
  - `supabase/functions/create-school/index.ts`
  - `src/pages/auth/ResetPassword.tsx`
- Best implementation path: add a secure backend reset endpoint rather than relying on the client to guess the correct auth email.
- Minimal fix does not require a database migration.
- Optional later enhancement: add a managed public record for admin login email if you want it editable/searchable in the dashboard, but that is not required to make reset emails work.

Bottom line

Cloudflare being active only means the website/domain DNS is live. The Platform Admin reset is failing because it is wired to the wrong email field, and the branded auth sender is still not fully active.