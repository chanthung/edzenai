// Analyze fee collection trends and surface anomalies for a school.
// Computes class-wise + overall month-over-month deltas, then asks Gemini
// to rank the most important insights for the admin dashboard.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PaymentRow {
  amount_paid: number;
  payment_date: string;
  student_id: string;
}
interface StudentRow {
  id: string;
  class_name: string | null;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function ymKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function sb<T>(path: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!r.ok) throw new Error(`Supabase ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { school_id } = await req.json();
    if (!school_id || typeof school_id !== "string") {
      return new Response(JSON.stringify({ error: "school_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Pull students for this school (id + class)
    const students = await sb<StudentRow[]>(
      `students?school_id=eq.${school_id}&select=id,class_name`,
    );
    const studentClass = new Map<string, string>();
    for (const s of students) studentClass.set(s.id, s.class_name || "Unassigned");
    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return new Response(
        JSON.stringify({ insights: [], summary: "No students yet." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Pull last 90 days of payments scoped to those students
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 90);
    const sinceStr = since.toISOString().slice(0, 10);

    // Chunk student IDs for the in() filter
    const chunks: string[][] = [];
    for (let i = 0; i < studentIds.length; i += 200) chunks.push(studentIds.slice(i, i + 200));
    const allPayments: PaymentRow[] = [];
    for (const chunk of chunks) {
      const list = chunk.map((id) => `"${id}"`).join(",");
      const rows = await sb<PaymentRow[]>(
        `payments?student_id=in.(${list})&payment_date=gte.${sinceStr}&select=amount_paid,payment_date,student_id`,
      );
      allPayments.push(...rows);
    }

    // 3. Aggregate by month + class
    const now = new Date();
    const thisMonth = ymKey(now);
    const last = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    const lastMonth = ymKey(last);

    const totals = {
      [thisMonth]: 0,
      [lastMonth]: 0,
    } as Record<string, number>;
    const byClass: Record<string, { thisM: number; lastM: number; payers: Set<string> }> = {};

    for (const p of allPayments) {
      const d = new Date(p.payment_date);
      const k = ymKey(d);
      const cls = studentClass.get(p.student_id) || "Unassigned";
      if (!byClass[cls]) byClass[cls] = { thisM: 0, lastM: 0, payers: new Set() };
      const amt = Number(p.amount_paid) || 0;
      if (k === thisMonth) {
        totals[thisMonth] += amt;
        byClass[cls].thisM += amt;
        byClass[cls].payers.add(p.student_id);
      } else if (k === lastMonth) {
        totals[lastMonth] += amt;
        byClass[cls].lastM += amt;
      }
    }

    // Class-wise deltas (skip negligible classes)
    const classDeltas = Object.entries(byClass)
      .map(([cls, v]) => {
        const delta = v.thisM - v.lastM;
        const pct = v.lastM > 0 ? (delta / v.lastM) * 100 : v.thisM > 0 ? 100 : 0;
        return {
          class_name: cls,
          this_month: Math.round(v.thisM),
          last_month: Math.round(v.lastM),
          change_pct: Math.round(pct),
          payers_this_month: v.payers.size,
        };
      })
      .filter((c) => c.this_month > 0 || c.last_month > 0)
      .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));

    const overall = {
      this_month: Math.round(totals[thisMonth]),
      last_month: Math.round(totals[lastMonth]),
      change_pct:
        totals[lastMonth] > 0
          ? Math.round(((totals[thisMonth] - totals[lastMonth]) / totals[lastMonth]) * 100)
          : 0,
    };

    // If absolutely no activity — short-circuit
    if (overall.this_month === 0 && overall.last_month === 0) {
      return new Response(
        JSON.stringify({
          insights: [],
          summary: "No collections recorded in the last two months.",
          overall,
          class_deltas: classDeltas,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Ask Gemini to rank insights
    const monthLabel = (s: string) => {
      const [y, m] = s.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
    };

    const aiPayload = {
      this_month_label: monthLabel(thisMonth),
      last_month_label: monthLabel(lastMonth),
      overall,
      classes: classDeltas.slice(0, 15), // cap input size
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You are a school finance analyst. Surface 2-4 short, actionable anomaly alerts about fee collection trends. Plain English, no jargon. Each insight: one sentence describing the change, optional one-sentence suggested action. Use Indian Rupee formatting (₹). Skip insights below ±15% change unless overall total dropped sharply.",
          },
          {
            role: "user",
            content:
              "Analyze this school's collection data and return prioritized anomaly alerts:\n" +
              JSON.stringify(aiPayload, null, 2),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_anomalies",
              description: "Return prioritized collection anomaly insights.",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "One-line headline summary of overall collection health.",
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short title, e.g. 'Class 7 dropped 40%'" },
                        detail: { type: "string", description: "One sentence with the numbers." },
                        action: { type: "string", description: "Optional suggested next step." },
                        severity: {
                          type: "string",
                          enum: ["info", "warning", "critical"],
                        },
                      },
                      required: ["title", "detail", "severity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_anomalies" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: { summary: string; insights: any[] } = { summary: "", insights: [] };
    if (toolCall?.function?.arguments) {
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse AI tool args", e);
      }
    }

    return new Response(
      JSON.stringify({
        summary: parsed.summary,
        insights: parsed.insights,
        overall,
        class_deltas: classDeltas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-collection-anomalies error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
