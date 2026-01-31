
# Auto-Update Telegram Registration Status

## Overview
Create a backend function that n8n can call to automatically mark students as "Telegram registered" when their parents register with the bot. This eliminates the need for manual updates.

## How It Will Work

```text
Parent sends /start to Telegram Bot
           |
           v
    n8n Workflow 1
           |
    +------+------+
    |             |
    v             v
Save to       Call Lovable
Google        Backend Function
Sheets        (NEW STEP)
                  |
                  v
           Update student's
           telegram_registered = true
```

## What Changes

### In Lovable (I will create)
A new backend function: `mark-telegram-registered`

- **Endpoint**: Will be called by n8n
- **Input**: Phone number (in 10-digit format)
- **Action**: Finds student(s) with matching `parent_phone` and sets `telegram_registered = true`
- **Security**: Public endpoint (no auth required) but validates input

### In n8n Workflow 1 (You will add)
After your "Write to Google Sheets" step, add:

| Node Type | HTTP Request |
|-----------|--------------|
| Method | POST |
| URL | `https://fwnvfkaihuqdfdcwkakj.supabase.co/functions/v1/mark-telegram-registered` |
| Headers | `Content-Type: application/json` |
| Body | `{ "phone": "{{ normalized 10-digit phone }}" }` |

---

## Implementation Steps

### Step 1: Create Backend Function
Create `supabase/functions/mark-telegram-registered/index.ts`:

```typescript
// Key functionality:
// 1. Accept POST with { phone: "9612159599" }
// 2. Normalize phone to 10 digits
// 3. Update all students with matching parent_phone
// 4. Return success/error response
```

The function will:
- Use the service role key to bypass RLS (since this is a server-to-server call)
- Normalize phone numbers to handle format variations
- Update all matching students (in case same parent has multiple children)

### Step 2: Update config.toml
Add the new function configuration:

```toml
[functions.mark-telegram-registered]
verify_jwt = false
```

### Step 3: n8n Workflow 1 Changes (Your Action)
After the Google Sheets write step, add an **HTTP Request** node:

| Setting | Value |
|---------|-------|
| Node Name | Mark Registered in Lovable |
| Method | POST |
| URL | `https://fwnvfkaihuqdfdcwkakj.supabase.co/functions/v1/mark-telegram-registered` |
| Authentication | None |
| Body Type | JSON |
| Body | See below |

**Body (use expression mode):**
```json
{
  "phone": "{{ $json.phone_number.replace(/^\\+?91/, '').slice(-10) }}"
}
```

This normalizes the phone from Telegram format to 10-digit format to match your database.

---

## Security Considerations
- The endpoint only updates `telegram_registered` field (nothing sensitive)
- Phone number matching uses normalized 10-digit format
- No sensitive data is exposed in responses
- Rate limiting could be added later if needed

---

## Testing
1. After implementation, manually trigger n8n Workflow 1 with a test phone
2. Check if the student's `telegram_registered` field updates in the database
3. Verify the Telegram icon appears in the Students table

