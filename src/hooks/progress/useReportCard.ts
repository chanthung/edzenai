import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';

export interface ReportCardSubjectRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  subjectType: 'academic' | 'co_curricular' | 'vocational';
  terms: Record<string, { marksObtained: number; maxMarks: number; percentage: number; grade: string | null }>;
  overallPercentage: number;
  overallGrade: string | null;
}

export interface ReportCardData {
  student: {
    id: string;
    name: string;
    className: string | null;
    section: string | null;
    rollNumber: string | null;
    parentName: string | null;
  };
  schoolName: string;
  schoolLogoUrl: string | null;
  schoolAddress: string | null;
  academicYear: string;
  termNames: string[];
  scholastic: ReportCardSubjectRow[];
  coScholastic: ReportCardSubjectRow[];
  grandTotal: { obtained: number; max: number; percentage: number; grade: string | null };
}

export function useReportCard(studentId: string | null, academicYearId: string | null) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['report-card', schoolId, studentId, academicYearId],
    queryFn: async (): Promise<ReportCardData | null> => {
      if (!schoolId || !studentId || !academicYearId) return null;

      // Fetch student, school, academic year, marks, subjects in parallel
      const [studentRes, schoolRes, yearRes, marksRes, subjectsRes, assignmentRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', studentId).single(),
        supabase.from('schools').select('name, logo_url, address').eq('id', schoolId).single(),
        supabase.from('academic_years').select('name').eq('id', academicYearId).single(),
        supabase.from('student_marks').select(`
          *,
          assessments!inner(id, name, assessment_type, class_name, academic_year_id),
          subjects!inner(id, name, code, subject_type)
        `)
          .eq('student_id', studentId)
          .eq('assessments.academic_year_id', academicYearId),
        supabase.from('subjects').select('*').eq('school_id', schoolId).order('display_order'),
        supabase.from('class_template_assignments').select('template_id').eq('school_id', schoolId).eq('academic_year_id', academicYearId),
      ]);

      if (studentRes.error || !studentRes.data) return null;
      const student = studentRes.data;
      const schoolName = schoolRes.data?.name ?? '';
      const academicYear = yearRes.data?.name ?? '';
      const marks = marksRes.data ?? [];

      // Get grade mappings if template assigned
      let gradeMappings: Array<{ min_percentage: number; max_percentage: number; grade_label: string }> = [];
      const classAssignment = assignmentRes.data?.find(
        (a: any) => true // Take any template assignment for grade lookup
      );
      if (classAssignment) {
        const { data: mappings } = await supabase
          .from('template_grade_mappings')
          .select('*')
          .eq('template_id', classAssignment.template_id)
          .order('display_order');
        if (mappings) gradeMappings = mappings;
      }

      // Build a grade lookup function
      const getGrade = (percentage: number): string | null => {
        if (gradeMappings.length === 0) return null;
        const sorted = [...gradeMappings].sort((a, b) => b.min_percentage - a.min_percentage);
        for (const m of sorted) {
          if (percentage >= m.min_percentage && percentage <= m.max_percentage) return m.grade_label;
        }
        return null;
      };

      // Get unique term/assessment names in order
      const termNamesSet = new Map<string, string>();
      marks.forEach((m: any) => {
        const name = m.assessments?.name;
        const id = m.assessments?.id;
        if (name && id && !termNamesSet.has(name)) {
          termNamesSet.set(name, id);
        }
      });
      const termNames = Array.from(termNamesSet.keys());

      // Build subject rows
      const subjectMap = new Map<string, ReportCardSubjectRow>();

      marks.forEach((m: any) => {
        const subId = m.subjects?.id;
        const subName = m.subjects?.name;
        const termName = m.assessments?.name;
        if (!subId || !subName || !termName) return;

        if (!subjectMap.has(subId)) {
          subjectMap.set(subId, {
            subjectId: subId,
            subjectName: subName,
            subjectCode: m.subjects?.code ?? null,
            subjectType: m.subjects?.subject_type ?? 'academic',
            terms: {},
            overallPercentage: 0,
            overallGrade: null,
          });
        }

        const row = subjectMap.get(subId)!;
        const pct = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
        row.terms[termName] = {
          marksObtained: m.marks_obtained,
          maxMarks: m.max_marks,
          percentage: pct,
          grade: m.grade ?? getGrade(pct),
        };
      });

      // Calculate overall per subject
      subjectMap.forEach((row) => {
        const termValues = Object.values(row.terms);
        if (termValues.length === 0) return;
        const totalObtained = termValues.reduce((s, t) => s + t.marksObtained, 0);
        const totalMax = termValues.reduce((s, t) => s + t.maxMarks, 0);
        row.overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        row.overallGrade = getGrade(row.overallPercentage);
      });

      const allRows = Array.from(subjectMap.values());
      const scholastic = allRows.filter(r => r.subjectType === 'academic');
      const coScholastic = allRows.filter(r => r.subjectType !== 'academic');

      // Grand total
      const allTermValues = allRows.flatMap(r => Object.values(r.terms));
      const grandObtained = allTermValues.reduce((s, t) => s + t.marksObtained, 0);
      const grandMax = allTermValues.reduce((s, t) => s + t.maxMarks, 0);
      const grandPct = grandMax > 0 ? Math.round((grandObtained / grandMax) * 100) : 0;

      return {
        student: {
          id: student.id,
          name: student.name,
          className: student.class_name,
          section: student.section,
          rollNumber: student.roll_number,
          parentName: student.parent_name,
        },
        schoolName,
        academicYear,
        termNames,
        scholastic,
        coScholastic,
        grandTotal: {
          obtained: grandObtained,
          max: grandMax,
          percentage: grandPct,
          grade: getGrade(grandPct),
        },
      };
    },
    enabled: !!schoolId && !!studentId && !!academicYearId,
  });
}
