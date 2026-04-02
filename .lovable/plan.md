

## Plan: Set Up Branded Auth Email Templates

### Problem
The email domain `notify.www.edzenai.com` is verified and active, but auth email templates (password reset, verification, etc.) have never been scaffolded. Without them, all auth emails use the default Lovable templates sent from `no-reply@auth.lovable.cloud`.

### What Will Be Done

**Step 1: Scaffold auth email templates**
Generate the 6 auth email templates (signup, recovery, magic-link, invite, email-change, reauthentication) and the `auth-email-hook` Edge Function that intercepts auth emails and renders them using custom templates.

**Step 2: Apply EdZen AI branding**
Read the project's CSS variables and styling, then update all 6 templates with:
- EdZen AI brand colors (primary color, fonts, button styles)
- App name "EdZen AI" in all copy
- White background (email standard) with brand accent colors
- Matching tone/language from the app

**Step 3: Deploy the auth-email-hook Edge Function**
Deploy so the hook is live and starts intercepting auth emails.

### Result
After deployment, password reset and all other auth emails will be sent from your verified domain (`notify.www.edzenai.com`) with EdZen AI branding instead of the generic Lovable default.

### Files Created
- `supabase/functions/auth-email-hook/index.ts` — Edge Function handling auth email events
- `supabase/functions/auth-email-hook/deno.json` — Deno config
- `supabase/functions/_shared/email-templates/*.tsx` — 6 branded email templates

