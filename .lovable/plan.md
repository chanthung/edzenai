

## Current Issues with Your n8n Setup

From your screenshots, there are **3 problems**:

1. **Deprecated model**: `gemini-pro` → should be `gemini-2.5-flash` or `gemini-1.5-flash`
2. **Field name mismatch**: Your prompt maps to `student_name`, `class`, `phone` but the frontend expects `name`, `class_name`, `parent_phone`, `parent_email`
3. **Response format**: Gemini returns `{ candidates: [{ content: { parts: [{ text: "..." }] } }] }` — you need a Code node after the HTTP Request to extract and parse the JSON from the text field

## Recommended Approach: Eliminate n8n, Use Lovable AI

Your project already has `LOVABLE_API_KEY` configured. Instead of debugging the n8n workflow, I can rewrite the edge function to:

1. **Parse the Excel/CSV directly** in the edge function (using a lightweight XLSX library)
2. **Call Lovable AI** (Gemini) directly via the pre-configured gateway to map columns and clean data
3. **Return structured results** — no external webhook needed

### What Changes

**1 file modified**: `supabase/functions/process-student-excel/index.ts`

- Remove the n8n webhook proxy logic
- Add CSV/XLSX parsing using SheetJS (loaded from CDN)
- Send extracted rows to Lovable AI gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with a prompt to map columns to `name`, `roll_number`, `class_name`, `section`, `parent_name`, `parent_phone`, `parent_email`, `guardian`, `address`
- Use tool calling to get structured JSON output (no fragile JSON parsing)
- Return `{ students: [...], warnings: [...] }` to the frontend

### Benefits
- No n8n dependency for this feature
- No external API key needed (LOVABLE_API_KEY is auto-configured)
- Fewer moving parts = fewer errors
- The frontend `BulkStudentUpload` component requires **zero changes**

### If You Prefer to Keep n8n
I can instead just tell you the exact fixes for your 3 n8n nodes. Let me know.

