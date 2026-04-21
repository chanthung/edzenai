// OCR payment proof screenshots via Lovable AI Gateway
// Returns extracted { amount, transaction_id, date, confidence } for client auto-fill.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OcrResult {
  ocr_status: "success" | "failed";
  ocr_confidence?: "high" | "medium" | "low";
  amount?: number | null;
  transaction_id?: string | null;
  date?: string | null;
  raw?: unknown;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, mimeType } = await req.json();
    if (!fileUrl || typeof fileUrl !== "string") {
      return json({ ocr_status: "failed", reason: "Missing fileUrl" }, 400);
    }

    // PDFs (and other non-image types) — fall back to manual entry
    if (mimeType && !String(mimeType).startsWith("image/")) {
      return json({ ocr_status: "failed", reason: "Unsupported mime type for OCR" });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ ocr_status: "failed", reason: "AI gateway not configured" }, 500);
    }

    // Download the image and convert to base64 data URL
    const imgResp = await fetch(fileUrl);
    if (!imgResp.ok) {
      return json({ ocr_status: "failed", reason: "Could not fetch screenshot" });
    }
    const ct = imgResp.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) {
      return json({ ocr_status: "failed", reason: "Not an image" });
    }
    const buf = new Uint8Array(await imgResp.arrayBuffer());
    // Base64 encode
    let binary = "";
    for (let i = 0; i < buf.byteLength; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);
    const dataUrl = `data:${ct};base64,${b64}`;

    // Call Lovable AI Gateway with tool calling for structured output
    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You extract Indian UPI / bank transfer payment details from screenshots (GPay, PhonePe, Paytm, BHIM, bank apps). Return only structured data via the provided tool. Amount must be the rupee value the user paid (a number, no symbols). UTR / transaction ID is the alphanumeric reference (often 10-22 chars). Date should be ISO format YYYY-MM-DD if visible. Confidence: 'high' if all three (amount, UTR, date) are clearly readable; 'medium' if one is missing or partially clear; 'low' if image is unclear. If the screenshot is not a payment receipt, set confidence to 'low' and leave fields empty.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Extract payment details from this screenshot." },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_payment_details",
                description: "Return extracted payment details",
                parameters: {
                  type: "object",
                  properties: {
                    amount: {
                      type: ["number", "null"],
                      description: "Payment amount in INR (number only)",
                    },
                    transaction_id: {
                      type: ["string", "null"],
                      description: "UTR / transaction reference",
                    },
                    date: {
                      type: ["string", "null"],
                      description: "Date in YYYY-MM-DD format",
                    },
                    confidence: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                    },
                  },
                  required: ["confidence"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_payment_details" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return json({ ocr_status: "failed", reason: "Rate limited" });
      }
      if (aiResp.status === 402) {
        return json({ ocr_status: "failed", reason: "AI credits exhausted" });
      }
      return json({ ocr_status: "failed", reason: "AI gateway error" });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ ocr_status: "failed", reason: "No structured response", raw: aiJson });
    }

    let args: any = {};
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      return json({ ocr_status: "failed", reason: "Bad JSON from model", raw: aiJson });
    }

    const result: OcrResult = {
      ocr_status: "success",
      ocr_confidence: args.confidence || "low",
      amount: typeof args.amount === "number" ? args.amount : null,
      transaction_id: args.transaction_id || null,
      date: args.date || null,
      raw: aiJson,
    };

    return json(result);
  } catch (e) {
    console.error("ocr-payment-proof error:", e);
    return json({ ocr_status: "failed", reason: e instanceof Error ? e.message : "Unknown" });
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
