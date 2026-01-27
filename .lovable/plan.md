
# Send Parent Links via WhatsApp/SMS using n8n

## Overview
Add a "Share Link" button to the Students page that triggers an n8n workflow to send the unique Parent View link to each parent's registered mobile number via WhatsApp or SMS.

## Architecture

The solution involves:
1. A new backend function that receives the share request
2. Integration with n8n via webhook
3. UI button in the Students table to trigger sharing

## Implementation Steps

### Step 1: Connect n8n to the Project

Before implementation, you'll need to connect your n8n instance:

1. In your n8n instance, go to **Settings → MCP access** and enable MCP
2. For each workflow you want to use with Lovable, open the workflow and enable **"Available in MCP"** in the workflow settings

### Step 2: Create n8n Workflow

Create a workflow in n8n with:
- **Webhook Trigger**: Receives student data (name, phone, link)
- **WhatsApp Business API** or **Twilio SMS** node: Sends the message
- **Response node**: Returns success/failure

| Node | Purpose |
|------|---------|
| Webhook | Receives: `{ studentName, parentPhone, parentLink, schoolName }` |
| Message Formatter | Creates personalized message with the link |
| WhatsApp/SMS | Sends to parent's phone number |

Example message template:
```
Dear Parent,

Access {studentName}'s fee details securely:
{parentLink}

- {schoolName}
```

### Step 3: Create Backend Function

**File**: `supabase/functions/send-parent-link/index.ts`

| Feature | Description |
|---------|-------------|
| Authentication | Requires school admin auth |
| Validation | Checks student has valid phone number |
| n8n Call | Sends webhook to n8n workflow |
| Logging | Records share attempt for audit |

The function will:
1. Validate the authenticated user is a school admin
2. Fetch student details (name, phone, access_token)
3. Build the Parent View URL
4. Call the n8n webhook with the payload
5. Return success/failure response

### Step 4: Add Secret for n8n Webhook URL

Store the n8n webhook URL as a secret:
- **Secret Name**: `N8N_PARENT_LINK_WEBHOOK_URL`
- **Value**: Your n8n webhook URL (e.g., `https://your-n8n.app.n8n.cloud/webhook/...`)

### Step 5: Update Students Page UI

**File**: `src/pages/admin/Students.tsx`

| Change | Description |
|--------|-------------|
| Add Share icon button | Next to Copy button in Parent Link column |
| Add loading state | Show spinner while sending |
| Handle response | Show success/error toast |
| Bulk share option | Optional: Add "Share All Links" button in header |

The Share button will:
- Be disabled if parent_phone is missing
- Show a confirmation dialog before sending
- Display loading state during the API call
- Show success/error feedback via toast

### Step 6: Add Share Tracking (Optional)

**Database**: Add a `link_shares` table to track when links were shared

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| student_id | uuid | FK to students |
| shared_at | timestamp | When link was sent |
| shared_by | uuid | Admin who shared |
| delivery_status | text | pending/sent/failed |

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/send-parent-link/index.ts` | Create | Backend function to call n8n |
| `supabase/config.toml` | Modify | Register new function |
| `src/pages/admin/Students.tsx` | Modify | Add Share button with send logic |

## Security Considerations

| Concern | Solution |
|---------|----------|
| Only admins can share | Auth validation in backend function |
| Phone number validation | Check format before sending |
| Rate limiting | n8n workflow can include throttling |
| Audit trail | Log all share attempts |

## n8n Workflow Example Structure

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Webhook   │────▶│ Format Message   │────▶│ WhatsApp/Twilio │
│   Trigger   │     │ with Link        │     │ Send Message    │
└─────────────┘     └──────────────────┘     └─────────────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │   Respond     │
                                              │   to Webhook  │
                                              └───────────────┘
```

## User Experience

When the admin clicks "Share":
1. Confirmation dialog: "Send fee link to {parentPhone} for {studentName}?"
2. Loading spinner on button
3. Success toast: "Link sent to {parentPhone}!"
4. Error handling if phone is missing or send fails

## Prerequisites Before Implementation

1. **n8n Account**: You need an n8n instance (cloud or self-hosted)
2. **WhatsApp Business API** or **Twilio Account**: For message delivery
3. **n8n Webhook URL**: The URL of your workflow's webhook trigger
