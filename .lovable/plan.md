Plan: Correct "Telegram" to "WhatsApp" in plan feature lists

Goal
During initial school signup (and anywhere else the Starter plan is displayed), the Starter plan feature list should say "Parent Link & WhatsApp" instead of "Parent Link & Telegram". WhatsApp is the actual messaging channel implemented via Mayavi InfoTech.

Changes
1. Update `src/config/plan-features.ts`:
   - Change the Starter plan feature string from `'Parent Link & Telegram'` to `'Parent Link & WhatsApp'`.

2. Update `src/pages/Pricing.tsx`:
   - Change the feature string `"Parent Link & Telegram notifications"` to `"Parent Link & WhatsApp notifications"`.

3. Verify the onboarding page (`/onboard`) and `/pricing` render the corrected text, and no other "Telegram" references remain in the app source.

No new components, backend changes, or data migrations are required.
