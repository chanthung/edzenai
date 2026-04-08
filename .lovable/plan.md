

## Plan: Set Up Transactional Emails for EdZen AI

### What We're Building

Four branded email templates that send automatically when specific events happen in your app:

1. **Welcome Email** — Sent to the school admin when a new school is onboarded (via the `onboard-school` function)
2. **Payment Receipt Email** — Sent alongside the existing WhatsApp confirmation when a payment is recorded
3. **Order/Subscription Confirmation Email** — Sent when a school's subscription is activated or plan is changed
4. **Security Alert Email** — Sent on password changes, new device logins, or admin role changes

### How It Works

- All emails will come from `support@edzenai.com` (your verified domain)
- Each email will be branded with EdZen AI's indigo/purple theme and logo
- Emails are queued with automatic retries — no emails get lost
- An unsubscribe page will be added for compliance

### Implementation Steps

**Step 1 — Scaffold email infrastructure**
Set up the transactional email Edge Functions (`send-transactional-email`, `handle-email-unsubscribe`, `handle-email-suppression`) and the template registry.

**Step 2 — Create 4 email templates**
Each as a branded React Email component matching EdZen AI's design:
- `welcome-school.tsx` — school name, admin name, getting-started link
- `payment-receipt.tsx` — student name, amount, date, school name
- `subscription-confirmation.tsx` — plan name, billing period, amount
- `security-alert.tsx` — alert type, timestamp, action description

**Step 3 — Wire up triggers**
- **Welcome**: Add `supabase.functions.invoke('send-transactional-email')` call inside the `onboard-school` Edge Function after school creation succeeds
- **Payment receipt**: Add email send call in `PaymentRecorder.tsx` and `PaymentProofVerifier.tsx` alongside the existing WhatsApp notification
- **Subscription confirmation**: Add email send in the platform admin flow when activating a school subscription
- **Security alert**: Add email send in the `ResetPassword` page and relevant auth state changes

**Step 4 — Create unsubscribe page**
A branded `/unsubscribe` page matching EdZen AI's design for email compliance.

**Step 5 — Deploy all Edge Functions**

### Technical Details

- Templates use React Email components with EdZen AI's indigo primary (`hsl(245, 58%, 51%)`), white body background, and Inter font stack
- All sends include idempotency keys derived from event IDs to prevent duplicates
- Emails go through the pgmq queue with automatic retry (up to 5 attempts)
- Suppression list is checked automatically — bounced/complained addresses are blocked

