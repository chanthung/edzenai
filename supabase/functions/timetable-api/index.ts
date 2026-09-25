import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const ENGINE_SECRET_HEADER = "x-timetable-engine-secret";

// CORS headers extended to permit the engine-secret header for browser requests.
const corsHeadersExtended = {
  ...corsHeaders,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timetable-engine-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersExtended, "Content-Type": "application/json" },
  });

const QuerySchema = z.object({
  school_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
});

// Constant-time comparison so response timing never leaks secret content.
async function secretMatches(received: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(received)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

type FetchResult<T> = { error: true } | { error: false; data: T };

async function fetchTimeSlots(
  client: ReturnType<typeof createClient>,
  school_id: string,
  academic_year_id: string,
): Promise<FetchResult<unknown[]>> {
  const { data, error } = await client
    .from("timetable_time_slots")
    .select("id, school_id, academic_year_id, weekday, period_number, start_time, end_time, is_active")
    .eq("school_id", school_id)
    .eq("academic_year_id", academic_year_id)
    .order("weekday", { ascending: true })
    .order("period_number", { ascending: true });

  if (error) {
    console.error("[timetable-api] time_slots query failed", error);
    return { error: true };
  }
  return { error: false, data: data ?? [] };
}

async function fetchBreaks(
  client: ReturnType<typeof createClient>,
  school_id: string,
  academic_year_id: string,
): Promise<FetchResult<unknown[]>> {
  const { data, error } = await client
    .from("timetable_breaks")
    .select("id, school_id, academic_year_id, weekday, break_type, after_period, duration_minutes, is_active")
    .eq("school_id", school_id)
    .eq("academic_year_id", academic_year_id)
    .order("weekday", { ascending: true })
    .order("after_period", { ascending: true });

  if (error) {
    console.error("[timetable-api] breaks query failed", error);
    return { error: true };
  }
  return { error: false, data: data ?? [] };
}

// Rooms are school-scoped (not year-specific), so they filter by school_id only.
async function fetchRooms(
  client: ReturnType<typeof createClient>,
  school_id: string,
): Promise<FetchResult<unknown[]>> {
  const { data, error } = await client
    .from("timetable_rooms")
    .select("id, school_id, name, room_type, capacity, is_active")
    .eq("school_id", school_id)
    .order("name", { ascending: true });

  if (error) {
    console.error("[timetable-api] rooms query failed", error);
    return { error: true };
  }
  return { error: false, data: data ?? [] };
}

// Subject requirements are year-scoped and ordered by class, section, priority, subject.
async function fetchSubjectRequirements(
  client: ReturnType<typeof createClient>,
  school_id: string,
  academic_year_id: string,
): Promise<FetchResult<unknown[]>> {
  const { data, error } = await client
    .from("timetable_subject_requirements")
    .select("id, school_id, academic_year_id, class_name, section, subject_id, periods_per_week, delivery_mode, elective_group, consecutive_periods, preferred_weekdays, priority, status")
    .eq("school_id", school_id)
    .eq("academic_year_id", academic_year_id)
    .order("class_name", { ascending: true })
    .order("section", { ascending: true })
    .order("priority", { ascending: false })
    .order("subject_id", { ascending: true });

  if (error) {
    console.error("[timetable-api] subject_requirements query failed", error);
    return { error: true };
  }
  return { error: false, data: data ?? [] };
}

// Generic read-only helper for the additional engine inputs.
async function readRows(
  label: string,
  query: PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<FetchResult<unknown[]>> {
  const { data, error } = await query;
  if (error) {
    console.error(`[timetable-api] ${label} query failed`, error);
    return { error: true };
  }
  return { error: false, data: data ?? [] };
}

// All reads run in parallel; a combined 200 carries every read-only engine input.
async function fetchSchedule(
  client: ReturnType<typeof createClient>,
  school_id: string,
  academic_year_id: string,
): Promise<Response> {
  const results = await Promise.all([
    fetchTimeSlots(client, school_id, academic_year_id),
    fetchBreaks(client, school_id, academic_year_id),
    fetchRooms(client, school_id),
    fetchSubjectRequirements(client, school_id, academic_year_id),
    readRows("teachers", client
      .from("school_teachers")
      .select("id, user_id, school_id, name, email, employee_id, role, is_active")
      .eq("school_id", school_id)
      .eq("is_active", true)
      .eq("role", "teacher")
      .order("name", { ascending: true })),
    readRows("teacher_subject_assignments", client
      .from("teacher_subject_assignments")
      .select("id, teacher_id, subject_id, school_id, class_name, academic_year_id")
      .eq("school_id", school_id)
      .eq("academic_year_id", academic_year_id)
      .order("class_name", { ascending: true })
      .order("teacher_id", { ascending: true })
      .order("subject_id", { ascending: true })),
    readRows("subjects", client
      .from("subjects")
      .select("id, school_id, name, code, display_order, subject_type")
      .eq("school_id", school_id)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true })),
    readRows("teacher_availability", client
      .from("timetable_teacher_availability")
      .select("id, school_id, teacher_id, academic_year_id, time_slot_id, is_available, reason")
      .eq("school_id", school_id)
      .eq("academic_year_id", academic_year_id)
      .order("teacher_id", { ascending: true })
      .order("time_slot_id", { ascending: true })),
    // No active flag on this table: every saved rule is a live constraint.
    readRows("room_requirements", client
      .from("timetable_room_requirements")
      .select("id, school_id, subject_id, academic_year_id, class_name, required_room_type, preferred_room_id, is_mandatory")
      .eq("school_id", school_id)
      .or(`academic_year_id.is.null,academic_year_id.eq.${academic_year_id}`)
      .order("class_name", { ascending: true })
      .order("subject_id", { ascending: true })),
  ]);
  if (results.some((r) => r.error)) return json({ error: "Internal error" }, 500);
  const [slots, breaks, rooms, reqs, teachers, tsa, subjects, avail, roomReqs] =
    results.map((r) => (r as { data: unknown[] }).data);
  return json({
    school_id,
    academic_year_id,
    time_slots: slots,
    breaks,
    rooms,
    subject_requirements: reqs,
    teachers,
    teacher_subject_assignments: tsa,
    subjects,
    teacher_availability: avail,
    room_requirements: roomReqs,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersExtended });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      school_id: url.searchParams.get("school_id") ?? undefined,
      academic_year_id: url.searchParams.get("academic_year_id") ?? undefined,
    });
    if (!parsed.success) {
      return json({ error: "Invalid parameters", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { school_id, academic_year_id } = parsed.data;

    // ---- Path 1: timetable engine (server-to-server) ----
    const engineHeader = req.headers.get(ENGINE_SECRET_HEADER);
    if (engineHeader !== null) {
      const expected = Deno.env.get("TIMETABLE_ENGINE_SECRET");
      if (!expected || !(await secretMatches(engineHeader, expected))) {
        return json({ error: "Unauthorized" }, 401);
      }
      // Privileged read-only access to the database, never exposed to the client.
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      return await fetchSchedule(serviceClient, school_id, academic_year_id);
    }

    // ---- Path 2: signed-in user (unchanged) ----
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

    return await fetchSchedule(supabase, school_id, academic_year_id);
  } catch (e) {
    console.error("[timetable-api] unexpected", e);
    return json({ error: "Internal error" }, 500);
  }
});
