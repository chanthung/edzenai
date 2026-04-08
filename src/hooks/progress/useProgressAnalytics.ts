import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';

export type ProgressStatus = 'improving' | 'stable' | 'declining' | 'new';

export interface StudentProgress {
  studentId: string;
  studentName: string;
  className: string | null;
  section: string | null;
  rollNumber: string | null;
  averagePercentage: number;
  status: ProgressStatus;
  trend: number; // percentage change from last assessment
  isAtRisk: boolean;
  assessmentCount: number;
  subjectBreakdown: Array<{
    subjectId: string;
    subjectName: string;
    averagePercentage: number;
    trend: number;
  }>;
}

export function useProgressAnalytics(academicYearId?: string, className?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  const { data: classProgress = [], isLoading: isLoadingClassProgress } = useQuery({
    queryKey: ['class-progress', schoolId, academicYearId, className],
    queryFn: async (): Promise<StudentProgress[]> => {
      if (!schoolId || !academicYearId) return [];

      // Get all students in the school (optionally filtered by class)
      let studentsQuery = supabase
        .from('students')
        .select('id, name, class_name, section, roll_number')
        .eq('school_id', schoolId);

      if (className) {
        studentsQuery = studentsQuery.eq('class_name', className);
      }

      const { data: students, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      if (!students || students.length === 0) return [];

      // Get all marks for these students in the academic year
      const studentIds = students.map((s) => s.id);
      const { data: marks, error: marksError } = await supabase
        .from('student_marks')
        .select(`
          id,
          student_id,
          marks_obtained,
          max_marks,
          assessments!inner(id, assessment_date, academic_year_id),
          subjects!inner(id, name)
        `)
        .in('student_id', studentIds)
        .eq('assessments.academic_year_id', academicYearId)
        .order('assessments(assessment_date)', { ascending: true });

      if (marksError) throw marksError;

      // Group marks by student
      const studentMarksMap = new Map<string, typeof marks>();
      marks?.forEach((mark) => {
        const studentMarks = studentMarksMap.get(mark.student_id) || [];
        studentMarks.push(mark);
        studentMarksMap.set(mark.student_id, studentMarks);
      });

      // Calculate progress for each student
      return students.map((student) => {
        const studentMarks = studentMarksMap.get(student.id) || [];
        
        if (studentMarks.length === 0) {
          return {
            studentId: student.id,
            studentName: student.name,
            className: student.class_name,
            section: student.section,
            rollNumber: student.roll_number,
            averagePercentage: 0,
            status: 'new' as ProgressStatus,
            trend: 0,
            isAtRisk: false,
            assessmentCount: 0,
            subjectBreakdown: [],
          };
        }

        // Calculate overall average
        const totalPercentage = studentMarks.reduce((sum, m) => {
          return sum + (m.marks_obtained / m.max_marks) * 100;
        }, 0);
        const averagePercentage = Math.round(totalPercentage / studentMarks.length);

        // Group by assessment to get chronological averages
        const assessmentAverages: Array<{ date: string | null; average: number }> = [];
        const assessmentGroups = new Map<string, typeof studentMarks>();
        
        studentMarks.forEach((mark) => {
          const assessmentId = mark.assessments?.id;
          if (assessmentId) {
            const group = assessmentGroups.get(assessmentId) || [];
            group.push(mark);
            assessmentGroups.set(assessmentId, group);
          }
        });

        assessmentGroups.forEach((group) => {
          const avg = group.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / group.length;
          assessmentAverages.push({
            date: group[0]?.assessments?.assessment_date || null,
            average: avg,
          });
        });

        // Sort by date
        assessmentAverages.sort((a, b) => {
          if (!a.date) return -1;
          if (!b.date) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        // Calculate trend (comparing last two assessments)
        let trend = 0;
        let status: ProgressStatus = 'stable';

        if (assessmentAverages.length >= 2) {
          const latest = assessmentAverages[assessmentAverages.length - 1].average;
          const previous = assessmentAverages[assessmentAverages.length - 2].average;
          trend = Math.round(latest - previous);

          if (trend >= 5) status = 'improving';
          else if (trend <= -5) status = 'declining';
          else status = 'stable';
        } else if (assessmentAverages.length === 1) {
          status = 'new';
        }

        // At risk: declining trend OR average below 40%
        const isAtRisk = status === 'declining' || averagePercentage < 40;

        // Subject breakdown
        const subjectMap = new Map<string, { name: string; marks: Array<{ obtained: number; max: number }> }>();
        studentMarks.forEach((mark) => {
          const subjectId = mark.subjects?.id;
          const subjectName = mark.subjects?.name;
          if (subjectId && subjectName) {
            const existing = subjectMap.get(subjectId) || { name: subjectName, marks: [] };
            existing.marks.push({ obtained: mark.marks_obtained, max: mark.max_marks });
            subjectMap.set(subjectId, existing);
          }
        });

        const subjectBreakdown = Array.from(subjectMap.entries()).map(([subjectId, data]) => {
          const avg = data.marks.reduce((sum, m) => sum + (m.obtained / m.max) * 100, 0) / data.marks.length;
          // Simple trend: compare first and last marks
          let subjectTrend = 0;
          if (data.marks.length >= 2) {
            const first = (data.marks[0].obtained / data.marks[0].max) * 100;
            const last = (data.marks[data.marks.length - 1].obtained / data.marks[data.marks.length - 1].max) * 100;
            subjectTrend = Math.round(last - first);
          }
          return {
            subjectId,
            subjectName: data.name,
            averagePercentage: Math.round(avg),
            trend: subjectTrend,
          };
        });

        return {
          studentId: student.id,
          studentName: student.name,
          className: student.class_name,
          section: student.section,
          rollNumber: student.roll_number,
          averagePercentage,
          status,
          trend,
          isAtRisk,
          assessmentCount: assessmentGroups.size,
          subjectBreakdown,
        };
      });
    },
    enabled: !!schoolId && !!academicYearId,
  });

  return {
    classProgress,
    isLoadingClassProgress,
  };
}
