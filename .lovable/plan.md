# Replace "Lovable" branding on Google Sign-In screen with EdZen AI

## The issue

The "Sign in to Lovable" screen with the Lovable logo (shown in your screenshots) is **not** rendered by your app — it is Google's own OAuth consent screen. Its branding (app name + logo + privacy/terms links) comes from whichever Google Cloud project owns the OAuth Client ID being used.

Right now, EdZen AI uses **Lovable Cloud's shared/managed Google OAuth credentials**, so Google shows "Lovable" branding to every user. No code change in this repo can override that — the only fix is to use **your own Google OAuth credentials** registered to EdZen AI.

## What needs to happen

This is a **configuration task**, not a code task. Here is the plan:

### 1. Create EdZen AI's own Google OAuth credentials (you do this in Google Cloud Console)

1. Go to https://console.cloud.google.com → create/select a project named "EdZen AI".
2. **OAuth consent screen**:
   - App name: `EdZen AI`
   - User support email: `support@edzenai.com`
   - App logo: upload the EdZen AI logo (square PNG, ≥120×120, <1MB)
   - App domain: `edzenai.com`
   - Authorized domains: `edzenai.com`, `lovable.app`
   - Privacy Policy URL: `https://edzenai.com/privacy-policy`
   - Terms of Service URL: `https://edzenai.com/terms-of-service`
   - Scopes: `userinfo.email`, `userinfo.profile`, `openid`
3. **Verification**: Submitting the app + logo to Google for verification is required before all users see the EdZen AI logo (unverified apps show a warning and a generic look). Verification typically takes a few days.
4. **Credentials → Create OAuth Client ID** (type: Web application):
   - Authorized JavaScript origins: `https://edzenai.com`, `https://www.edzenai.com`, `https://easykiwi.lovable.app`, your preview `*.lovable.app` URL
   - Authorized redirect URIs: the callback URL shown inside Lovable Cloud → Users → Authentication Settings → Sign In Methods → Google (it looks like `https://fwnvfkaihuqdfdcwkakj.supabase.co/auth/v1/callback`)
5. Copy the generated **Client ID** and **Client Secret**.

### 2. Plug those credentials into Lovable Cloud

In the Lovable Cloud dashboard → **Users → Authentication Settings → Sign In Methods → Google**:
- Toggle "Use your own credentials"
- Paste the Client ID and Client Secret from step 1
- Save

After this, Google will show:
- "Sign in to **EdZen AI**" (instead of Lovable)
- The EdZen AI logo (instead of the Lovable heart icon)
- Links to **edzenai.com** Privacy Policy & Terms

### 3. No code changes required

I checked `src/contexts/AuthContext.tsx` and `src/integrations/lovable/index.ts` — the OAuth call (`lovable.auth.signInWithOAuth("google", …)`) automatically uses whichever Google credentials are configured in Lovable Cloud. Once you swap to your own credentials in step 2, every Google sign-in across the app (landing page, /login, /signup, /onboard) will show EdZen AI branding — no code edits needed.

## What I will do once you approve

Because this is purely a dashboard configuration change, my role is to:
1. Open the backend dashboard for you (via the View Backend action) so you can paste the credentials.
2. Stand by to verify the flow once you've swapped credentials — I can walk you through testing it in the preview.

If you'd like, I can also:
- Add an EdZen AI logo asset under `public/` at a stable URL you can reference when uploading the logo to Google's consent screen (Google requires a publicly hosted square image).

## Summary of where branding comes from

| Screen | Controlled by | Fix |
|---|---|---|
| "Choose an account" / "Sign in to Lovable" / Lovable heart logo | Google Cloud OAuth consent screen of the credentials in use | Use EdZen AI's own Google OAuth credentials (steps above) |
| In-app login/signup buttons & screens | This codebase | Already EdZen AI branded |
