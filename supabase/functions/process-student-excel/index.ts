import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseWithRecovery(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (e) {
    // attempt to repair truncated JSON array
    const lastBrace = content.lastIndexOf("}");
    if (lastBrace > 0) {
      const repaired = content.substring(0, lastBrace + 1) + "]";
      try {
        const items = JSON.parse(repaired);
        console.warn(`Recovered ${Array.isArray(items) ? items.length : 'unknown'} items from truncated response`);
        return items;
      } catch {
        // Try wrapping in object
        try {
          const repairedObj = content.substring(0, lastBrace + 1);
          return JSON.parse(repairedObj);
        } catch {
          console.error("Cannot repair truncated JSON");
        }
      }
    }
    throw new Error(`Invalid JSON response from webhook. First 200 chars: ${content.substring(0, 200)}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get("N8N_STUDENT_IMPORT_WEBHOOK_URL");
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "N8N_STUDENT_IMPORT_WEBHOOK_URL is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileBase64, fileName } = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ error: "fileBase64 and fileName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64, fileName }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook error:", n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI processing failed (${n8nResponse.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read response as text first, then parse
    const responseText = await n8nResponse.text();
    
    if (!responseText || responseText.trim().length === 0) {
      console.error("n8n returned empty response. The webhook may be in async mode.");
      return new Response(
        JSON.stringify({ error: "The webhook returned an empty response. Please ensure your n8n webhook node uses 'Respond to Webhook' (not 'Respond Immediately')." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = parseWithRecovery(responseText);

    // Handle n8n async mode response
    if (result && typeof result === "object" && "message" in (result as Record<string, unknown>) && (result as Record<string, unknown>).message === "Workflow was started") {
      return new Response(
        JSON.stringify({ error: "The n8n webhook is running in async mode. Please switch your Webhook node to use 'Respond to Webhook' node at the end of your workflow instead of 'Respond Immediately'." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-student-excel error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
