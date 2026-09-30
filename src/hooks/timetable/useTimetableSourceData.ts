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

/**
 * Valid classes for a school + academic year come from:
 *  - student_enrollments (year-scoped, with sections)
 *  - class_template_assignments (year-scoped, class only)
 * Sections for classes without enrolled students come from teacher_class_assignments,
 * used only for classes already valid for this year.
 */
export function useEnrolledClassSections(academicYearId: string | null, schoolId: string | null) {
  return useQuery({
    queryKey: ["timetable-class-sections", academicYearId, schoolId],
    enabled: !!academicYearId && !!schoolId,
    queryFn: async () => {
      const [enrRes, ctaRes, tcaRes] = await Promise.all([
        supabase
          .from("student_enrollments")
          .select("class_name, section")
          .eq("academic_year_id", academicYearId!),
        supabase
          .from("class_template_assignments")
          .select("class_name")
          .eq("school_id", schoolId!)
          .eq("academic_year_id", academicYearId!),
        supabase
          .from("teacher_class_assignments")
          .select("class_name, section")
          .eq("school_id", schoolId!),
      ]);
      if (enrRes.error) throw enrRes.error;
      if (ctaRes.error) throw ctaRes.error;
      if (tcaRes.error) throw tcaRes.error;

      const sectionsByClass = new Map<string, Set<string | null>>();
      const add = (cls: string, section: string | null) => {
        const set = sectionsByClass.get(cls) ?? new Set<string | null>();
        set.add(section);
        sectionsByClass.set(cls, set);
      };
      for (const r of enrRes.data ?? []) add(r.class_name, r.section ?? null);

      const validClasses = new Set<string>([
        ...(enrRes.data ?? []).map((r) => r.class_name),
        ...(ctaRes.data ?? []).map((r) => r.class_name),
      ]);
      const enrolledClasses = new Set((enrRes.data ?? []).map((r) => r.class_name));

      // Sections for year-valid classes that have no enrolled students yet.
      for (const r of tcaRes.data ?? []) {
        if (validClasses.has(r.class_name) && !enrolledClasses.has(r.class_name)) {
          add(r.class_name, r.section ?? null);
        }
      }
      for (const cls of validClasses) if (!sectionsByClass.has(cls)) add(cls, null);

      const out: ClassSection[] = [];
      for (const [cls, sections] of sectionsByClass) {
        const named = [...sections].filter((s) => s);
        const list = named.length > 0 ? named : [null];
        for (const section of list) {
          out.push({
            class_name: cls,
            section,
            label: section ? `${cls} - ${section}` : cls,
          });
        }
      }
      return out.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
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
