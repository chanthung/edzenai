import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import type { ReportCardData, ReportCardSubjectRow } from './useReportCard';

/**
 * Fetches report cards for ALL students in a given class for a given academic year.
 */
export function useClassReportCards(className: string | null, academicYearId: string | null) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['class-report-cards', schoolId, className, academicYearId],
    queryFn: async (): Promise<ReportCardData[]> => {
      if (!schoolId || !className || !academicYearId) return [];

      // Fetch students, school, year, marks, subjects, template assignments in parallel
      const [studentsRes, schoolRes, yearRes, marksRes, subjectsRes, assignmentRes] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', schoolId).eq('class_name', className).order('name'),
        supabase.from('schools').select('name').eq('id', schoolId).single(),
        supabase.from('academic_years').select('name').eq('id', academicYearId).single(),
        supabase.from('student_marks').select(`
          *,
          assessments!inner(id, name, assessment_type, class_name, academic_year_id),
          subjects!inner(id, name, code, subject_type)
        `)
          .eq('assessments.academic_year_id', academicYearId)
          .in('student_id', []), // placeholder — we'll re-fetch below
        supabase.from('subjects').select('*').eq('school_id', schoolId).order('display_order'),
        supabase.from('class_template_assignments').select('template_id')
          .eq('school_id', schoolId)
          .eq('academic_year_id', academicYearId)
          .eq('class_name', className),
      ]);

      const students = studentsRes.data ?? [];
      if (students.length === 0) return [];

      const schoolName = schoolRes.data?.name ?? '';
      const academicYear = yearRes.data?.name ?? '';
      const studentIds = students.map(s => s.id);

      // Fetch marks for all students in the class
      const { data: allMarks } = await supabase
        .from('student_marks')
        .select(`
          *,
          assessments!inner(id, name, assessment_type, class_name, academic_year_id),
          subjects!inner(id, name, code, subject_type)
        `)
        .in('student_id', studentIds)
        .eq('assessments.academic_year_id', academicYearId);

      const marks = allMarks ?? [];

      // Get grade mappings
      let gradeMappings: Array<{ min_percentage: number; max_percentage: number; grade_label: string }> = [];
      const classAssignment = assignmentRes.data?.[0];
      if (classAssignment) {
        const { data: mappings } = await supabase
          .from('template_grade_mappings')
          .select('*')
          .eq('template_id', classAssignment.template_id)
          .order('display_order');
        if (mappings) gradeMappings = mappings;
      }

      const getGrade = (percentage: number): string | null => {
        if (gradeMappings.length === 0) return null;
        const sorted = [...gradeMappings].sort((a, b) => b.min_percentage - a.min_percentage);
        for (const m of sorted) {
          if (percentage >= m.min_percentage && percentage <= m.max_percentage) return m.grade_label;
        }
        return null;
      };

      // Group marks by student
      const marksByStudent = new Map<string, any[]>();
      marks.forEach((m: any) => {
        const sid = m.student_id;
        if (!marksByStudent.has(sid)) marksByStudent.set(sid, []);
        marksByStudent.get(sid)!.push(m);
      });

      // Build report card for each student
      return students.map(student => {
        const studentMarks = marksByStudent.get(student.id) ?? [];

        // Term names
        const termNamesSet = new Map<string, string>();
        studentMarks.forEach((m: any) => {
          const name = m.assessments?.name;
          const id = m.assessments?.id;
          if (name && id && !termNamesSet.has(name)) termNamesSet.set(name, id);
        });
        const termNames = Array.from(termNamesSet.keys());

        // Subject rows
        const subjectMap = new Map<string, ReportCardSubjectRow>();
        studentMarks.forEach((m: any) => {
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
      }).filter(rc => rc.scholastic.length > 0 || rc.coScholastic.length > 0);
    },
    enabled: !!schoolId && !!className && !!academicYearId,
  });
}
