import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const QuerySchema = z.object({
  school_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      school_id: url.searchParams.get("school_id") ?? undefined,
      academic_year_id: url.searchParams.get("academic_year_id") ?? undefined,
    });
    if (!parsed.success) {
      return json({ error: "Invalid parameters", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { school_id, academic_year_id } = parsed.data;

    // Authorization via existing EdZen AI access functions (run as caller)
    const [adminRes, teacherRes] = await Promise.all([
      supabase.rpc("get_user_school_ids"),
      supabase.rpc("get_teacher_school_ids"),
    ]);
    if (adminRes.error || teacherRes.error) {
      console.error("[timetable-api] auth lookup failed", adminRes.error ?? teacherRes.error);
      return json({ error: "Internal error" }, 500);
    }
    const allowed = new Set<string>([
      ...((adminRes.data as string[] | null) ?? []),
      ...((teacherRes.data as string[] | null) ?? []),
    ]);
    if (!allowed.has(school_id)) return json({ error: "Forbidden" }, 403);

    const { data, error } = await supabase
      .from("timetable_time_slots")
      .select("id, school_id, academic_year_id, weekday, period_number, start_time, end_time, is_active")
      .eq("school_id", school_id)
      .eq("academic_year_id", academic_year_id)
      .order("weekday", { ascending: true })
      .order("period_number", { ascending: true });

    if (error) {
      console.error("[timetable-api] query failed", error);
      return json({ error: "Internal error" }, 500);
    }

    return json({ school_id, academic_year_id, time_slots: data ?? [] });
  } catch (e) {
    console.error("[timetable-api] unexpected", e);
    return json({ error: "Internal error" }, 500);
  }
});
