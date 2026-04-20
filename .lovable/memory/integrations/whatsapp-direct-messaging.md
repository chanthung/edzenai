---
name: whatsapp-direct-messaging
description: WhatsApp delivery via Mayavi InfoTech. Phones stored as 10-digit. Shared helper with retries. Provider-message-based invalid-vs-transient classification.
type: feature
---
The platform sends WhatsApp messages via Mayavi InfoTech (https://wp.mayaviinfotech.in/send-message).

**Phone storage**: `students.parent_phone` is always normalized to a 10-digit local Indian number. A DB trigger (`students_normalize_parent_phone`) enforces this on every insert/update by stripping `+`, spaces, leading `91` (when length 12), and leading `0` (when length 11). Frontend uses `src/lib/phone.ts` `normalizeIndianPhone()`. The `+91` is display-only chrome, never stored.

**Shared helper**: `supabase/functions/_shared/whatsapp.ts` provides `sendWhatsApp()` with:
- 3 retry attempts with exponential backoff (800ms, 1600ms)
- 12s timeout per request
- Provider-message regex matching to classify failures as `invalid_number` (only when provider explicitly says "not registered" / "not on whatsapp" / "invalid number") vs `transient` (everything else, including "göndərilmədi" / "not sent").
- Reads secret from either `WA_API_KEY` or `WHATSAPP_API_KEY`.
- `91` prefix added at send time.

**Dispatch logging**: `send-parent-link` writes to `parent_link_dispatches` (status: pending → sent/failed) using a service-role client, so the log is reliable regardless of caller RLS. UI inspects `data.success` and `data.failureKind` to show distinct messages for invalid numbers vs temporary outages. Failed sends never count as success in bulk flows.
