import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useTimetableSettings, useTimetableTimeSlots, useTimetableBreaks, useTimetableRooms,
  useSubjectRequirements, useRoomRequirements,
} from "./useTimetableConfigData";
import { useEnrolledClassSections, useSchoolSubjects, useActiveTeachers } from "./useTimetableSourceData";
import { useSchoolTeachingAssignments } from "@/hooks/useTeachingAssignments";
import { computeReadiness } from "@/lib/timetable-readiness";

/** Read-only. Reuses the cached configuration queries, so edits elsewhere refresh it automatically. */
export function useTimetableReadiness(schoolId: string | null, academicYearId: string | null) {
  const scope = { schoolId, academicYearId };
  const settings = useTimetableSettings(scope);
  const slots = useTimetableTimeSlots(scope);
  const breaks = useTimetableBreaks(scope);
  const rooms = useTimetableRooms(schoolId);
  const reqs = useSubjectRequirements(scope);
  const roomReqs = useRoomRequirements(scope);
  const classes = useEnrolledClassSections(academicYearId, schoolId);
  const subjects = useSchoolSubjects(schoolId);
  const teachers = useActiveTeachers(schoolId);
  const assignments = useSchoolTeachingAssignments(academicYearId, schoolId);

  const enabled = !!schoolId && !!academicYearId;
  const availability = useQuery({
    queryKey: ["timetable-availability-all", schoolId, academicYearId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_teacher_availability")
        .select("teacher_id, time_slot_id, is_available")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!);
      if (error) throw error;
      return data ?? [];
    },
  });
  const runs = useQuery({
    queryKey: ["timetable-runs-status", schoolId, academicYearId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_runs")
        .select("status, created_at, solver_stats")
        .eq("school_id", schoolId!)
        .eq("academic_year_id", academicYearId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const all = [settings, slots, breaks, rooms, reqs, roomReqs, classes, subjects, teachers, assignments, availability, runs];
  const isLoading = all.some((q) => q.isLoading);
  const v = <T,>(q: { isError: boolean; isSuccess: boolean; data: T }) => (q.isSuccess && !q.isError ? q.data : undefined);

  const result = useMemo(
    () =>
      computeReadiness({
        settings: v(settings) as any,
        slots: v(slots) as any,
        breaks: v(breaks) as any,
        rooms: v(rooms) as any,
        requirements: v(reqs) as any,
        roomRequirements: v(roomReqs) as any,
        assignments: v(assignments) as any,
        teacherIds: v(teachers)?.map((t) => t.id),
        availability: v(availability) as any,
        classSections: v(classes),
        expectedSubjectsByClass: v(subjects)?.subjectIdsByClass,
        runs: v(runs) as any,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    all.map((q) => q.data).concat(all.map((q) => q.isError)),
  );

  return { ...result, isLoading };
}
