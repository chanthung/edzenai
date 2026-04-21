// Generate assessment template structure from a free-text description using Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Please describe your assessment system." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tools = [
      {
        type: "function",
        function: {
          name: "build_assessment_template",
          description: "Build a complete school assessment template structure based on the user's description.",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Short, descriptive template name (e.g. 'CBSE Secondary FA+SA')." },
              grading_type: {
                type: "string",
                enum: ["percentage", "custom_grades"],
                description: "Use 'custom_grades' if school uses letter grades like A+/A/B; otherwise 'percentage'.",
              },
              terms: {
                type: "array",
                description: "Ordered list of terms / exam periods (e.g. FA1, FA2, SA1, SA2 or Term 1, Term 2, Final).",
                items: { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false },
              },
              components: {
                type: "array",
                description: "Mark components that make up each term (e.g. Periodic Test 20, Notebook 10, Subject Enrichment 10, SEE 60).",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    max_marks: { type: "number", description: "Maximum marks for this component (positive integer)." },
                  },
                  required: ["name", "max_marks"],
                  additionalProperties: false,
                },
              },
              grade_mappings: {
                type: "array",
                description: "Required only when grading_type='custom_grades'. Percentage bands → grade label.",
                items: {
                  type: "object",
                  properties: {
                    grade_label: { type: "string", description: "e.g. A+, A, B, C" },
                    min_percentage: { type: "number" },
                    max_percentage: { type: "number" },
                  },
                  required: ["grade_label", "min_percentage", "max_percentage"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name", "grading_type", "terms", "components"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "You design school assessment templates for Indian and international boards (CBSE, ICSE, State Boards, IB, Cambridge IGCSE, Montessori). Given a short description, return a complete, sensible structure via the provided tool. Use standard board conventions: CBSE secondary uses Periodic Test (20) + Notebook (10) + Subject Enrichment (10) + SEE (60). ICSE typically uses 80 external + 20 internal. Cambridge uses coursework + final. Always include grade_mappings when grading_type is custom_grades.",
          },
          { role: "user", content: description.trim() },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "build_assessment_template" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const txt = await response.text();
      console.error("AI gateway error", response.status, txt);
      return new Response(JSON.stringify({ error: "AI generation failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return a usable structure. Please rephrase." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ template: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-assessment-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
