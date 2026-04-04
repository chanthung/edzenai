

## Plan: Replace n8n with Direct WhatsApp API (Mayavi InfoTech)

### What Changes

Replace the n8n webhook call in `send-parent-link` with a direct POST to `https://wp.mayaviinfotech.in/send-message` using the provided API.

### Steps

**Step 1: Store WhatsApp API key as a secret**
- Add secret `WA_API_KEY` with value `fBzKSvlS9THYKClpUsBSIecBAFio3l`
- The sender number `919436078446` will be hardcoded in the function (not sensitive)

**Step 2: Rewrite `supabase/functions/send-parent-link/index.ts`**
- Remove n8n webhook logic entirely
- Update parent link URL from `easykiwi.lovable.app` to `www.edzenai.com`
- POST directly to `https://wp.mayaviinfotech.in/send-message` with this body:
  ```json
  {
    "api_key": "<from WA_API_KEY secret>",
    "sender": "919436078446",
    "number": "<parent_phone>",
    "message": "Hello <studentName>,\n\nYour parent portal is ready. View fees, attendance & progress here:\n<parentLink>\n\n- <schoolName>",
    "footer": "Sent via <schoolName>"
  }
  ```
- Validate response `{ "status": true }` for success

### Technical Details

- The `N8N_PARENT_LINK_WEBHOOK_URL` secret becomes unused (no deletion needed, just ignored)
- No database changes required
- No frontend changes needed — the existing "Send Link" and bulk-send buttons call the same edge function
- The `mark-telegram-registered` function is now also unused but harmless to leave

### Files Modified
- `supabase/functions/send-parent-link/index.ts` — full rewrite of the messaging section

