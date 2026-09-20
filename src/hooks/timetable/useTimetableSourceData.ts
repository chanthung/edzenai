import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Read-only access to the existing EdZen AI records the timetable configuration
 * refers to. Nothing here is duplicated into timetable tables.
 */

export interface ClassSection {
  class_name: string;
  section: string | null;
  label: string;
}

export function useEnrolledClassSections(academicYearId: string | null) {
  return useQuery({
    queryKey: ["timetable-class-sections", academicYearId],
    enabled: !!academicYearId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("class_name, section")
        .eq("academic_year_id", academicYearId!);
      if (error) throw error;
      const map = new Map<string, ClassSection>();
      for (const row of data ?? []) {
        const section = row.section ?? null;
        const key = `${row.class_name}||${section ?? ""}`;
        if (!map.has(key)) {
          map.set(key, {
            class_name: row.class_name,
            section,
            label: section ? `${row.class_name} - ${section}` : row.class_name,
          });
        }
      }
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      );
    },
  });
}

export interface TimetableSubject {
  id: string;
  name: string;
  code: string | null;
}

/** All subjects of the school, plus which classes each is assigned to. */
export function useSchoolSubjects(schoolId: string | null) {
  return useQuery({
    queryKey: ["timetable-subjects", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const [subjectsRes, assignmentsRes] = await Promise.all([
        supabase.from("subjects").select("id, name, code").eq("school_id", schoolId!).order("name"),
        supabase
          .from("subject_class_assignments")
          .select("subject_id, class_name")
          .eq("school_id", schoolId!),
      ]);
      if (subjectsRes.error) throw subjectsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      const byClass = new Map<string, string[]>();
      for (const a of assignmentsRes.data ?? []) {
        const list = byClass.get(a.class_name) ?? [];
        list.push(a.subject_id);
        byClass.set(a.class_name, list);
      }
      return {
        subjects: (subjectsRes.data ?? []) as TimetableSubject[],
        subjectIdsByClass: byClass,
      };
    },
  });
}

export interface TimetableTeacher {
  id: string;
  name: string;
  employee_id: string | null;
}

/** Active teachers of this school only. */
export function useActiveTeachers(schoolId: string | null) {
  return useQuery({
    queryKey: ["timetable-teachers", schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_teachers")
        .select("id, name, employee_id, role, is_active")
        .eq("school_id", schoolId!)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return ((data ?? []) as any[])
        .filter((t) => (t.role ?? "teacher") === "teacher")
        .map((t) => ({ id: t.id, name: t.name, employee_id: t.employee_id })) as TimetableTeacher[];
    },
  });
}
