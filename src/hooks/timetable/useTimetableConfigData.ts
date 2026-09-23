import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Timetable configuration data access.
 *
 * Tenant safety: every query/mutation is filtered by the school_id resolved from the
 * authenticated user's own school record (never from anything the browser supplies as
 * a free-form value), and row level security rejects any row outside that school.
 */

type Scope = { schoolId: string | null; academicYearId: string | null };

const ok = (s: Scope) => !!s.schoolId && !!s.academicYearId;

function onError(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  toast.error(message);
}

/* -------------------------------------------------- settings */

export interface TimetableSettings {
  id: string;
  school_id: string;
  academic_year_id: string;
  working_days: number[];
  day_start_time: string;
  default_period_minutes: number;
  periods_per_day: number;
  is_active: boolean;
}

export function useTimetableSettings({ schoolId, academicYearId }: Scope) {
  return useQuery({
    queryKey: ["timetable-settings", schoolId, academicYearId],
    enabled: ok({ schoolId, academicYearId }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_settings")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .maybeSingle();
      if (error) throw error;
      return (data as TimetableSettings) ?? null;
    },
  });
}

export function useSaveTimetableSettings(scope: Scope) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<TimetableSettings>) => {
      const { error } = await supabase
        .from("timetable_settings")
        .upsert(
          {
            school_id: scope.schoolId!,
            academic_year_id: scope.academicYearId!,
            working_days: values.working_days ?? [1, 2, 3, 4, 5],
            day_start_time: values.day_start_time!,
            default_period_minutes: values.default_period_minutes!,
            periods_per_day: values.periods_per_day!,
            is_active: values.is_active ?? true,
          },
          { onConflict: "school_id,academic_year_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Timetable settings saved");
      qc.invalidateQueries({ queryKey: ["timetable-settings", scope.schoolId, scope.academicYearId] });
    },
    onError,
  });
}

/* -------------------------------------------------- time slots */

export interface TimetableTimeSlot {
  id: string;
  school_id: string;
  academic_year_id: string;
  weekday: number;
  period_number: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function useTimetableTimeSlots({ schoolId, academicYearId }: Scope) {
  return useQuery({
    queryKey: ["timetable-time-slots", schoolId, academicYearId],
    enabled: ok({ schoolId, academicYearId }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_time_slots")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .order("weekday")
        .order("period_number");
      if (error) throw error;
      return (data ?? []) as TimetableTimeSlot[];
    },
  });
}

export function useTimeSlotMutations(scope: Scope) {
  const qc = useQueryClient();
  const key = ["timetable-time-slots", scope.schoolId, scope.academicYearId];
  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const save = useMutation({
    mutationFn: async (rows: Partial<TimetableTimeSlot>[]) => {
      const payload = rows.map((r) => ({
        id: r.id,
        school_id: scope.schoolId!,
        academic_year_id: scope.academicYearId!,
        weekday: r.weekday!,
        period_number: r.period_number!,
        start_time: r.start_time!,
        end_time: r.end_time!,
        is_active: r.is_active ?? true,
      }));
      const inserts = payload.filter((p) => !p.id).map(({ id, ...rest }) => rest);
      const updates = payload.filter((p) => p.id);
      if (inserts.length) {
        const { error } = await supabase.from("timetable_time_slots").insert(inserts);
        if (error) throw error;
      }
      for (const u of updates) {
        const { error } = await supabase
          .from("timetable_time_slots")
          .update(u)
          .eq("id", u.id!)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Periods saved");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_time_slots")
        .delete()
        .eq("id", id)
        .eq("school_id", scope.schoolId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Period removed");
      invalidate();
    },
    onError,
  });

  return { save, remove };
}

/* -------------------------------------------------- breaks */

export interface TimetableBreak {
  id: string;
  school_id: string;
  academic_year_id: string;
  weekday: number | null;
  break_type: string;
  after_period: number;
  duration_minutes: number;
  is_active: boolean;
}

export function useTimetableBreaks({ schoolId, academicYearId }: Scope) {
  return useQuery({
    queryKey: ["timetable-breaks", schoolId, academicYearId],
    enabled: ok({ schoolId, academicYearId }),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_breaks")
        .select("*")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .order("after_period");
      if (error) throw error;
      return (data ?? []) as TimetableBreak[];
    },
  });
}

export function useBreakMutations(scope: Scope) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["timetable-breaks", scope.schoolId, scope.academicYearId] });

  const save = useMutation({
    mutationFn: async (row: Partial<TimetableBreak>) => {
      const payload = {
        school_id: scope.schoolId!,
        academic_year_id: scope.academicYearId!,
        weekday: row.weekday ?? null,
        break_type: row.break_type ?? "short_break",
        after_period: row.after_period ?? 1,
        duration_minutes: row.duration_minutes ?? 15,
        is_active: row.is_active ?? true,
      };
      if (row.id) {
        const { error } = await supabase
          .from("timetable_breaks")
          .update(payload)
          .eq("id", row.id)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_breaks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Break saved");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_breaks")
        .delete()
        .eq("id", id)
        .eq("school_id", scope.schoolId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Break removed");
      invalidate();
    },
    onError,
  });

  return { save, remove };
}

/* -------------------------------------------------- rooms (school scoped, year independent) */

export interface TimetableRoom {
  id: string;
  school_id: string;
  name: string;
  room_type: string;
  capacity: number | null;
  is_active: boolean;
}

export function useTimetableRooms(schoolId: string | null) {
  return useQuery({
    queryKey: ["timetable-rooms", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_rooms")
        .select("*")
        .eq("school_id", schoolId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as TimetableRoom[];
    },
  });
}

export function useRoomMutations(schoolId: string | null) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["timetable-rooms", schoolId] });

  const save = useMutation({
    mutationFn: async (row: Partial<TimetableRoom>) => {
      const payload = {
        school_id: schoolId!,
        name: (row.name ?? "").trim(),
        room_type: row.room_type ?? "classroom",
        capacity: row.capacity ?? null,
        is_active: row.is_active ?? true,
      };
      if (!payload.name) throw new Error("Room name is required");
      if (row.id) {
        const { error } = await supabase
          .from("timetable_rooms")
          .update(payload)
          .eq("id", row.id)
          .eq("school_id", schoolId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_rooms").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Room saved");
      invalidate();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("duplicate key")) toast.error("A room with this name already exists");
      else onError(e);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_rooms")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Room removed");
      invalidate();
    },
    onError,
  });

  return { save, remove };
}

/* -------------------------------------------------- teacher availability */

export interface TeacherAvailability {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  time_slot_id: string;
  is_available: boolean;
  reason: string | null;
}

export function useTeacherAvailability(scope: Scope, teacherId: string | null) {
  return useQuery({
    queryKey: ["timetable-availability", scope.schoolId, scope.academicYearId, teacherId],
    enabled: ok(scope) && !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_teacher_availability")
        .select("*")
        .eq("school_id", scope.schoolId!)
        .eq("academic_year_id", scope.academicYearId!)
        .eq("teacher_id", teacherId!);
      if (error) throw error;
      return (data ?? []) as TeacherAvailability[];
    },
  });
}

export function useAvailabilityMutations(scope: Scope, teacherId: string | null) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: ["timetable-availability", scope.schoolId, scope.academicYearId, teacherId],
    });

  const setSlot = useMutation({
    mutationFn: async (args: {
      existingId?: string;
      timeSlotId: string;
      isAvailable: boolean;
      reason?: string | null;
    }) => {
      if (args.isAvailable && args.existingId) {
        const { error } = await supabase
          .from("timetable_teacher_availability")
          .delete()
          .eq("id", args.existingId)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
        return;
      }
      if (args.isAvailable) return;

      const payload = {
        school_id: scope.schoolId!,
        academic_year_id: scope.academicYearId!,
        teacher_id: teacherId!,
        time_slot_id: args.timeSlotId,
        is_available: false,
        reason: args.reason?.trim() ? args.reason.trim() : null,
      };
      if (args.existingId) {
        const { error } = await supabase
          .from("timetable_teacher_availability")
          .update(payload)
          .eq("id", args.existingId)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_teacher_availability").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError,
  });

  return { setSlot };
}

/* -------------------------------------------------- subject requirements */

export interface SubjectRequirement {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_name: string;
  section: string | null;
  subject_id: string;
  periods_per_week: number;
  delivery_mode: string;
  elective_group: string | null;
  consecutive_periods: number;
  preferred_weekdays: number[] | null;
  priority: number;
  status: string;
}

export function useSubjectRequirements(scope: Scope) {
  return useQuery({
    queryKey: ["timetable-subject-requirements", scope.schoolId, scope.academicYearId],
    enabled: ok(scope),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_subject_requirements")
        .select("*")
        .eq("school_id", scope.schoolId!)
        .eq("academic_year_id", scope.academicYearId!);
      if (error) throw error;
      return (data ?? []) as SubjectRequirement[];
    },
  });
}

export function useSubjectRequirementMutations(scope: Scope) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: ["timetable-subject-requirements", scope.schoolId, scope.academicYearId],
    });

  const save = useMutation({
    mutationFn: async (row: Partial<SubjectRequirement>) => {
      const payload = {
        school_id: scope.schoolId!,
        academic_year_id: scope.academicYearId!,
        class_name: row.class_name!,
        section: row.section ?? null,
        subject_id: row.subject_id!,
        periods_per_week: row.periods_per_week ?? 1,
        delivery_mode: row.delivery_mode ?? "theory",
        elective_group: row.elective_group?.trim() ? row.elective_group.trim() : null,
        consecutive_periods: row.consecutive_periods ?? 1,
        preferred_weekdays: row.preferred_weekdays?.length ? row.preferred_weekdays : null,
        priority: row.priority ?? 2,
        status: row.status ?? "active",
      };
      if (row.id) {
        const { error } = await supabase
          .from("timetable_subject_requirements")
          .update(payload)
          .eq("id", row.id)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_subject_requirements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Subject requirement saved");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_subject_requirements")
        .delete()
        .eq("id", id)
        .eq("school_id", scope.schoolId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Requirement removed");
      invalidate();
    },
    onError,
  });

  /**
   * Creates the missing class/section/subject rows derived from existing EdZen AI
   * records. Existing rows are never touched or overwritten.
   */
  const initialize = useMutation({
    mutationFn: async (
      combos: { class_name: string; section: string | null; subject_id: string }[]
    ) => {
      const { data: existing, error } = await supabase
        .from("timetable_subject_requirements")
        .select("class_name, section, subject_id")
        .eq("school_id", scope.schoolId!)
        .eq("academic_year_id", scope.academicYearId!);
      if (error) throw error;

      const keyOf = (c: string, s: string | null, sub: string) => `${c}||${s ?? ""}||${sub}`;
      const have = new Set((existing ?? []).map((r: any) => keyOf(r.class_name, r.section, r.subject_id)));

      const seen = new Set<string>();
      const missing = combos
        .filter((c) => {
          const k = keyOf(c.class_name, c.section, c.subject_id);
          if (have.has(k) || seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((c) => ({
          school_id: scope.schoolId!,
          academic_year_id: scope.academicYearId!,
          class_name: c.class_name,
          section: c.section,
          subject_id: c.subject_id,
          periods_per_week: 1,
          delivery_mode: "theory",
          elective_group: null,
          consecutive_periods: 1,
          preferred_weekdays: null,
          priority: 2,
          // Not configured yet - admins must set the real periods per week.
          status: "draft",
        }));

      for (let i = 0; i < missing.length; i += 300) {
        const { error: insErr } = await supabase
          .from("timetable_subject_requirements")
          .insert(missing.slice(i, i + 300));
        if (insErr) throw insErr;
      }
      return missing.length;
    },
    onSuccess: (count) => {
      toast.success(
        count === 0
          ? "Everything is already initialized"
          : `${count} subject requirement${count === 1 ? "" : "s"} created`
      );
      invalidate();
    },
    onError,
  });

  /** Applies the same values to a set of already saved requirement rows. */
  const bulkUpdate = useMutation({
    mutationFn: async (args: { ids: string[]; values: Partial<SubjectRequirement> }) => {
      if (!args.ids.length) return 0;
      const { error } = await supabase
        .from("timetable_subject_requirements")
        .update(args.values)
        .in("id", args.ids)
        .eq("school_id", scope.schoolId!);
      if (error) throw error;
      return args.ids.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} subject${count === 1 ? "" : "s"} updated`);
      invalidate();
    },
    onError,
  });

  return { save, remove, initialize, bulkUpdate };
}

/* -------------------------------------------------- room requirements */

export interface RoomRequirement {
  id: string;
  school_id: string;
  academic_year_id: string | null;
  subject_id: string;
  class_name: string | null;
  required_room_type: string | null;
  preferred_room_id: string | null;
  is_mandatory: boolean;
}

export function useRoomRequirements(scope: Scope) {
  return useQuery({
    queryKey: ["timetable-room-requirements", scope.schoolId, scope.academicYearId],
    enabled: !!scope.schoolId,
    queryFn: async () => {
      let q = supabase.from("timetable_room_requirements").select("*").eq("school_id", scope.schoolId!);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RoomRequirement[];
    },
  });
}

export function useRoomRequirementMutations(scope: Scope) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: ["timetable-room-requirements", scope.schoolId, scope.academicYearId],
    });

  const save = useMutation({
    mutationFn: async (row: Partial<RoomRequirement>) => {
      const payload = {
        school_id: scope.schoolId!,
        academic_year_id: row.academic_year_id ?? null,
        subject_id: row.subject_id!,
        class_name: row.class_name?.trim() ? row.class_name.trim() : null,
        required_room_type: row.required_room_type ?? null,
        preferred_room_id: row.preferred_room_id ?? null,
        is_mandatory: row.is_mandatory ?? false,
      };
      if (row.id) {
        const { error } = await supabase
          .from("timetable_room_requirements")
          .update(payload)
          .eq("id", row.id)
          .eq("school_id", scope.schoolId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("timetable_room_requirements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Room requirement saved");
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("timetable_room_requirements")
        .delete()
        .eq("id", id)
        .eq("school_id", scope.schoolId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Requirement removed");
      invalidate();
    },
    onError,
  });

  return { save, remove };
}
