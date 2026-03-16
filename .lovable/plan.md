

## Plan: Update Webhook URL Secret

The edge function logs confirm the current `N8N_PARENT_LINK_WEBHOOK_URL` secret is still pointing to the old n8n Cloud instance (returning "404 - No workspace here"). We need to update it to your new Hostinger VPS URL.

### What will change

1. **Update the `N8N_PARENT_LINK_WEBHOOK_URL` secret** to `https://n8n.srv1404769.hstgr.cloud/webhook/send-parent-link`

No code changes are needed — the edge function already reads this secret at runtime. Once updated, the Share button will call your Hostinger n8n instance instead of the old cloud one.

### Prerequisites on your side

Before this will work end-to-end, make sure:
- The n8n workflow on Hostinger is **toggled Active** (the toggle in the top-right of the workflow editor)
- The Telegram and Google Sheets credentials show green (no red warning triangles)

