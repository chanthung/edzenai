
Goal: make Contact Us reliable and fix the gap between “Message sent” in the UI and missing mail in the Hostinger inbox.

What I found
- The form itself is working: the contact page is calling the app email function successfully and getting a `200` response.
- The backend is also processing those requests: recent `contact-notification` entries for `support@edzenai.com` show `pending` → `sent`.
- The support inbox is not on the suppression list, and the sender domain `notify.www.edzenai.com` is verified.
- The main code-level gap is the sender identity for app emails: `send-transactional-email` is still using stale scaffolded branding:
  - `SITE_NAME = "easykiwi"`
  - From address built as `easykiwi <noreply@www.edzenai.com>`
- So this is not a broken form submission issue anymore. It is a delivery/reliability issue caused by stale sender configuration plus no durable backup of contact submissions.

Implementation plan
1. Refresh the app email sender identity
- Update the transactional email sender config so Contact Us mails go out as EdZen AI instead of `easykiwi`.
- Keep the verified sender domain aligned with the current email setup.
- Redeploy the email functions after the change.

2. Make Contact Us submissions durable
- Add a `contact_submissions` table in the backend.
- Save each valid form submission before sending the notification email.
- This ensures no inquiry is lost even if mailbox delivery is delayed, filtered, or missed.

3. Adjust the Contact Us success flow
- Change the success message from “Message sent” to “We’ve received your message”.
- If the submission is saved but email notification fails, keep the inquiry stored and show a softer notice instead of pretending inbox delivery is guaranteed.

4. Tighten the contact email path
- Keep the notification target centralized so the page copy and the email recipient stay in sync.
- Review the contact notification template so it clearly surfaces sender details in the subject/body for manual handling.

5. Verify end-to-end
- Submit the form again from the Contact page.
- Confirm:
  - a row is created in `contact_submissions`
  - email logs show the notification queued and sent
  - the Hostinger inbox receives the message
- If logs still show `sent` but Hostinger still does not show the email after sender cleanup, that will confirm the remaining issue is mailbox-side filtering rather than the app itself.

Files likely to change
- `src/pages/Contact.tsx`
- `supabase/functions/send-transactional-email/index.ts`
- `supabase/functions/_shared/transactional-email-templates/contact-notification.tsx`
- `supabase/migrations/...` (new migration for `contact_submissions`)

Technical details
- No issue was found in the frontend submit handler itself.
- No suppression/bounce record currently blocks `support@edzenai.com`.
- The biggest code smell is the stale transactional sender branding (`easykiwi`) while the rest of the project is branded `EdZen AI`.
- Adding backend storage is the safest fix so marketing/contact leads are never lost even if inbox delivery is imperfect.
