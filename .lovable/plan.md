
Goal
- Resolve the Contact Us email gap between “message received” in the app and no message appearing in the Hostinger inbox.

What I already verified
- The contact form is not using PHP `mail()` and it is not using Hostinger SMTP. It uses Lovable Cloud app-email functions plus a background queue.
- The recipient is correctly configured as `support@edzenai.com`.
- Contact submissions are being saved successfully in `contact_submissions`.
- Recent contact-notification entries show `pending -> sent` in the app email log.
- The sender domain `notify.www.edzenai.com` is verified, the queue cron job exists, and `support@edzenai.com` is not suppressed.

What this means
- The form itself is working correctly.
- The app is successfully handing the notification off to the sending service.
- The `sent` log status proves handoff to the mail service, not guaranteed inbox placement.
- The most likely remaining app-side issue is sender identity alignment: the code currently sends from `EdZen AI <noreply@www.edzenai.com>`, while the receiving mailbox is `support@edzenai.com`.

Implementation plan
1. Align the sender identity
- Review and correct the app-email sender configuration so the visible sender matches the real EdZen setup and avoids the current `www`/mailbox mismatch.
- Remove any stale hardcoded sender values if they do not match the verified configuration.

2. Improve the contact notification format
- Tighten the subject/body so each lead is unmistakable in mail filters and inbox search.
- If supported by the sending API, add a proper reply-to using the visitor’s email so replies go directly back to the lead.

3. Re-deploy the email runtime
- Re-deploy the contact email sender and queue processor after the sender cleanup so the live delivery path uses the corrected configuration.

4. Strengthen diagnostics
- Add better delivery metadata for contact notifications so each submission can be traced end-to-end from saved form entry to outbound email attempt.
- Keep the database-backed submission flow as the safety net so no lead is lost even if inbox delivery is delayed or filtered.

5. Verify against Hostinger logs
- Submit a fresh test inquiry.
- Confirm the same event appears in:
  - `contact_submissions`
  - the app email log as `pending -> sent`
  - Hostinger hPanel inbound logs for the same timestamp
- If the app still shows `sent` but Hostinger shows no inbound record after sender alignment, that isolates the remaining issue to receiving-side acceptance/filtering rather than the form flow.

Files likely to change
- `supabase/functions/send-transactional-email/index.ts`
- `supabase/functions/_shared/transactional-email-templates/contact-notification.tsx`
- `src/pages/Contact.tsx` (only if success/error messaging needs refinement)

Technical details
- Hostinger’s “use SMTP instead of PHP mail()” advice does not directly apply here because this form is not running through a PHP hosting stack.
- The recipient address is already correct in code.
- The verified sender domain and active queue prove the backend email pipeline is alive.
- The main code-level risk left is sender/domain presentation and deliverability hardening, not broken form submission logic.
