
# Fix Phone Number Mismatch Between Lovable and n8n Telegram Integration

## Problem Summary

When you click "Share" in the Students section:
1. Lovable sends student data including `parentPhone: "9612159599"` (10-digit format from your database)
2. n8n Workflow 2 receives this and tries to lookup the `chat_id` in Google Sheets
3. The lookup fails because Google Sheets stores phone numbers in a different format (from Telegram, which includes country code)

## Solution: Normalize Phone Numbers in n8n Workflow 2

You need to add a phone number normalization step in your n8n workflow so that lookups work regardless of format differences.

---

## Step-by-Step Fix in n8n Workflow 2

### Step 1: Check Your Google Sheets Data Format

Open your Google Sheet and check Column B (`phone_number`). Note the format:
- Is it `9612159599` (10 digits)?
- Is it `919612159599` (with country code, no +)?
- Is it `+919612159599` (with + and country code)?

### Step 2: Add a "Set" Node After the Webhook

Insert a **Set** node between your Webhook and Google Sheets Lookup:

| Setting | Value |
|---------|-------|
| Node Name | `Normalize Phone` |
| Mode | Manual Mapping |

Add these fields:

| Field Name | Value (Expression) |
|------------|---------------------|
| `originalPhone` | `{{ $json.parentPhone }}` |
| `normalizedPhone` | See expressions below based on your Google Sheets format |

**Choose the right expression based on your Google Sheets format:**

**If Google Sheets has 10-digit numbers (like `9612159599`):**
```javascript
{{ $json.parentPhone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10) }}
```

**If Google Sheets has numbers WITH country code (like `919612159599`):**
```javascript
{{ '91' + $json.parentPhone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10) }}
```

**If Google Sheets has numbers WITH + (like `+919612159599`):**
```javascript
{{ '+91' + $json.parentPhone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10) }}
```

### Step 3: Update Google Sheets Lookup

In your **Google Sheets** node (Read Rows operation):

| Setting | Value |
|---------|-------|
| Operation | Read Rows |
| Filters | Column B (phone_number) equals `{{ $json.normalizedPhone }}` |

### Step 4: Verify the IF Node

After the Google Sheets lookup, your IF node should check:

| Condition | Expression |
|-----------|------------|
| Check if chat_id exists | `{{ $json.chat_id }}` is not empty |

### Step 5: Telegram Send Node

In the TRUE branch of your IF node:

| Setting | Value |
|---------|-------|
| Chat ID | `{{ $json.chat_id }}` |
| Text | Your message with `{{ $('Webhook').item.json.parentLink }}` |

### Step 6: Respond to Webhook Node

**TRUE branch (chat_id found):**
```json
{
  "success": true,
  "message": "Link sent via Telegram"
}
```

**FALSE branch (chat_id not found):**
```json
{
  "success": false,
  "error": "Parent not registered on Telegram"
}
```

---

## Complete Workflow 2 Node Sequence

```text
Webhook Trigger
      |
      v
 Normalize Phone (Set node)
      |
      v
 Google Sheets Lookup
      |
      v
   IF Node (chat_id exists?)
     /        \
    /          \
 TRUE         FALSE
   |             |
   v             v
Telegram     Respond to Webhook
   |         (error message)
   v
Respond to Webhook
(success message)
```

---

## Debugging Tips

### Test in n8n with Manual Execution
1. Click "Execute Workflow" in n8n
2. Go to Lovable and click Share on a student
3. Watch each node's output in n8n to see where it fails

### Check These Common Issues

| Issue | Solution |
|-------|----------|
| Phone formats don't match | Add/adjust normalization in Set node |
| Wrong Google Sheets column | Verify you're filtering Column B |
| Telegram node error | Check Bot Token and that parent started a chat with bot |
| Empty response from Sheets | Verify the parent has registered with exact matching phone |

---

## Alternative: Store Phone Numbers Consistently

For a more robust long-term solution, you can also normalize phone numbers in **Workflow 1** when parents register:

In your Workflow 1, after extracting the phone from the parent's message, add a Set node to normalize it to a consistent 10-digit format before storing in Google Sheets.

This ensures both sides (Lovable database and Google Sheets) use the same format.

---

## Quick Test Checklist

1. Check one parent's phone in Google Sheets - note exact format
2. Check same parent's phone in Lovable Students table - note exact format
3. If different, add normalization in Workflow 2 Set node
4. Test the Share button again
5. Watch n8n execution to confirm lookup now returns data
