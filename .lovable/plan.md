## Goal
Verify whether the current `WA_API_KEY` (Mayavi InfoTech) is still valid, and make it easy to refresh if not. The recent "WhatsApp service is temporarily unavailable" toast came from 3 retries timing out against the provider — the endpoint itself is reachable in <0.5s, so the most likely cause is the configured key being rate-limited, expired, or silently held by the provider.

## Plan

### 1. Add a diagnostic edge function: `whatsapp-health`
- New function at `supabase/functions/whatsapp-health/index.ts`.
- Admin-only (verifies the caller is a platform admin or school admin via JWT + `user_roles` / `school_admins`).
- POST body: `{ testNumber?: string }` (optional — defaults to the sender number so no real message goes out).
- Calls `https://wp.mayaviinfotech.in/send-message` once with the configured `WA_API_KEY`, **short 8 s timeout, no retries**.
- Returns JSON:
  ```
  {
    keyConfigured: boolean,
    httpStatus: number | null,
    providerStatus: boolean | null,
    providerMessage: string,
    latencyMs: number,
    classification: "ok" | "invalid_key" | "rate_limited" | "timeout" | "invalid_number" | "unknown_error"
  }
  ```
- Classification rules: `"Invali api_key"` / `"sender"` text → `invalid_key`; HTTP 429 or "limit" text → `rate_limited`; abort → `timeout`; provider `status: true` → `ok`.

### 2. Surface it in Settings → Payment Details (admin only)
- Add a "Test WhatsApp delivery" button next to the existing WhatsApp/parent-link section in `src/pages/Settings.tsx` (admin-only block, gated the same way the existing settings are).
- On click: invoke `whatsapp-health`, show a toast + a small status card with `classification`, `latencyMs`, and `providerMessage`.
- If `classification === "invalid_key"`, show an inline note: "The WhatsApp API key is no longer accepted by the provider. Contact support to refresh it." (Refresh itself is done via the `add_secret` flow below, not from the UI.)

### 3. Refresh `WA_API_KEY` if the diagnostic confirms it's invalid
- If the test returns `invalid_key`, I'll trigger the secret-update flow via the `add_secret` tool for `WA_API_KEY` so you can paste the new key from Mayavi InfoTech.
- No code change to `_shared/whatsapp.ts` is required — it already reads `WA_API_KEY` and falls back to `WHATSAPP_API_KEY`.

### 4. No changes to existing send paths
- `send-parent-link`, retries (3), and backoff stay as-is.
- The existing memory rule `whatsapp-direct-messaging` (Mayavi InfoTech, +91 prepended, 2 retries / now 3) is unchanged.

## Out of scope
- No timeout / retry tuning.
- No background queue / auto-retry.
- No provider switch.

## Files to add / change
- **Add** `supabase/functions/whatsapp-health/index.ts`
- **Edit** `src/pages/Settings.tsx` — add the admin-only "Test WhatsApp delivery" button + result display in the Payment Details section.