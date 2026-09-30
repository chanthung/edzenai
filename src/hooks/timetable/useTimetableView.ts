import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ViewEntry {
  id: string;
  class_name: string;
  section: string | null;
  time_slot_id: string;
  subject_id: string;
  teacher_id: string | null;
  room_id: string | null;
}

export interface ViewSlot {
  id: string;
  weekday: number;
  period_number: number;
  start_time: string;
  end_time: string;
}

/** Read-only: latest solved/published run for school + year, with lookups. */
export function useTimetableView(schoolId: string | null, academicYearId: string | null) {
  return useQuery({
    queryKey: ["timetable-view", schoolId, academicYearId],
    enabled: !!schoolId && !!academicYearId,
    queryFn: async () => {
      const { data: runs, error: runErr } = await supabase
        .from("timetable_runs")
        .select("id, status, created_at")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .in("status", ["solved", "published"])
        .order("created_at", { ascending: false })
        .limit(1);
      if (runErr) throw runErr;
      const run = runs?.[0] ?? null;
      if (!run) return { run: null } as const;

      const [entriesRes, slotsRes, subjectsRes, teachersRes, roomsRes] = await Promise.all([
        supabase
          .from("timetable_entries")
          .select("id, class_name, section, time_slot_id, subject_id, teacher_id, room_id")
          .eq("run_id", run.id)
          .eq("school_id", schoolId!),
        supabase
          .from("timetable_time_slots")
          .select("id, weekday, period_number, start_time, end_time")
          .eq("school_id", schoolId!)
          .eq("academic_year_id", academicYearId!),
        supabase.from("subjects").select("id, name").eq("school_id", schoolId!),
        supabase.from("school_teachers").select("id, name").eq("school_id", schoolId!),
        supabase.from("timetable_rooms").select("id, name").eq("school_id", schoolId!),
      ]);
      for (const r of [entriesRes, slotsRes, subjectsRes, teachersRes, roomsRes]) {
        if (r.error) throw r.error;
      }
      const toMap = (rows: { id: string; name: string }[] | null) =>
        new Map((rows ?? []).map((r) => [r.id, r.name]));
      return {
        run,
        entries: (entriesRes.data ?? []) as ViewEntry[],
        slots: (slotsRes.data ?? []) as ViewSlot[],
        subjects: toMap(subjectsRes.data as any),
        teachers: toMap(teachersRes.data as any),
        rooms: toMap(roomsRes.data as any),
      } as const;
    },
  });
}
