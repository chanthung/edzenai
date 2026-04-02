

## Plan: Fix Password Reset Flow + Re-setup Email Domain

### Current State
- NS records for `notify.edzenai.com` have been deleted from Cloudflare (as recommended by Cloudflare support)
- The email domain status is still **Pending** — it needs to be re-configured using a Cloudflare-compatible method
- Password reset links use `window.location.origin` (preview URL) instead of `https://edzenai.com`
- ResetPassword page shows "Invalid or expired link" immediately without waiting for the auth client to process the recovery token

### What Will Be Done

**Step 1: Re-setup email domain (Cloudflare-compatible)**

Delete the current `notify.edzenai.com` email domain configuration and re-add it through the setup dialog. This time, the setup will detect Cloudflare and provide CNAME-based verification instructions (which Cloudflare Free supports) instead of NS delegation.

You'll see a setup dialog — follow the new DNS instructions it provides (likely a CNAME record instead of NS records).

**Step 2: Fix `EditSchoolDialog.tsx` — hardcode production redirect URL**

Change `redirectTo` from `window.location.origin` to `https://edzenai.com/reset-password` so password reset links always point to the live site, not preview URLs.

**Step 3: Fix `ResetPassword.tsx` — add loading state + PKCE detection**

- Add a 3-second "checking" state before showing "Invalid or expired link"
- Detect PKCE flow tokens (`?code=` query parameter) in addition to hash fragments
- This prevents the page from rendering the error before the auth client processes the recovery session

**Step 4: Scaffold branded auth email templates (after domain verifies)**

Once the email domain is verified, scaffold and deploy branded auth email templates so emails come from `support@edzenai.com` instead of `no-reply@auth.lovable.cloud`.

### Files Changed
- `src/components/platform/EditSchoolDialog.tsx` — hardcode `redirectTo` to `https://edzenai.com/reset-password`
- `src/pages/auth/ResetPassword.tsx` — add loading state, PKCE token detection, and delayed fallback

