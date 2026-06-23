// Admin-only diagnostic: pings Mayavi InfoTech WhatsApp provider with the
// configured WA_API_KEY and classifies the response so admins can tell whether
// delivery failures are a key/config issue or a transient provider problem.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Classification =
  | "ok"
  | "invalid_key"
  | "rate_limited"
  | "timeout"
  | "invalid_number"
  | "unknown_error";

function classify(httpStatus: number | null, providerStatus: boolean | null, msg: string, timedOut: boolean): Classification {
  if (timedOut) return "timeout";
  if (providerStatus === true) return "ok";
  const m = (msg || "").toLowerCase();
  if (/invali.*api.?key|invalid.*api.?key|invali.*sender|invalid.*sender|unauthor/.test(m)) return "invalid_key";
  if (httpStatus === 429 || /rate.?limit|too many|throttle|quota/.test(m)) return "rate_limited";
  if (/not\s*registered|not\s*on\s*whatsapp|invalid\s*(phone|number|recipient|wa)|no\s*whatsapp\s*account|unregistered/.test(m)) return "invalid_number";
  return "unknown_error";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Authenticate caller and require admin/teacher role on at least one school.
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const [{ data: roles }, { data: admins }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("school_admins").select("school_id").eq("user_id", userId).limit(1),
    ]);
    const isPlatformAdmin = (roles || []).some((r: any) => r.role === "platform_admin");
    const isSchoolAdmin = (admins || []).length > 0;
    if (!isPlatformAdmin && !isSchoolAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("WA_API_KEY") || Deno.env.get("WHATSAPP_API_KEY") || "";
    const keyConfigured = !!apiKey;
    if (!keyConfigured) {
      return new Response(
        JSON.stringify({
          keyConfigured: false,
          httpStatus: null,
          providerStatus: null,
          providerMessage: "WA_API_KEY is not configured",
          latencyMs: 0,
          classification: "invalid_key" as Classification,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ping the provider. We send to the sender number itself so no real parent
    // gets a test message. If the provider rejects self-send, we still get a
    // meaningful classification (invalid_number vs invalid_key vs ok).
    const body = await req.json().catch(() => ({}));
    const testNumber: string = (body?.testNumber as string) || "919366084335";

    const payload = {
      api_key: apiKey,
      sender: "919366084335",
      number: testNumber,
      message: "EdZen health check — please ignore.",
      footer: "",
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const start = Date.now();
    let httpStatus: number | null = null;
    let providerStatus: boolean | null = null;
    let providerMessage = "";
    let timedOut = false;

    try {
      const res = await fetch("https://wp.mayaviinfotech.in/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      httpStatus = res.status;
      let parsed: any = null;
      try { parsed = await res.json(); } catch { parsed = null; }
      providerStatus = typeof parsed?.status === "boolean" ? parsed.status : null;
      providerMessage = parsed?.msg || parsed?.message || `HTTP ${res.status}`;
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      providerMessage = msg;
      if (/abort/i.test(msg)) timedOut = true;
    }

    const latencyMs = Date.now() - start;
    const classification = classify(httpStatus, providerStatus, providerMessage, timedOut);

    return new Response(
      JSON.stringify({
        keyConfigured: true,
        httpStatus,
        providerStatus,
        providerMessage,
        latencyMs,
        classification,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
