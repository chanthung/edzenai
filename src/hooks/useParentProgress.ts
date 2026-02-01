import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MarkRecord {
  id: string;
  student_id: string;
  marks_obtained: number;
  max_marks: number;
  remarks: string | null;
  assessment_id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_date: string | null;
  subject_id: string;
  subject_name: string;
  subject_code: string | null;
}

interface AssessmentResult {
  id: string;
  name: string;
  type: string;
  date: string | null;
  overallPercentage: number;
  subjects: {
    id: string;
    name: string;
    code: string | null;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
  }[];
}

interface SubjectStats {
  id: string;
  name: string;
  code: string | null;
  averagePercentage: number;
  assessmentCount: number;
}

interface TrendDataPoint {
  name: string;
  percentage: number;
  date?: string;
}

interface RadarDataPoint {
  subject: string;
  student: number;
}

interface ParentProgressData {
  assessments: AssessmentResult[];
  subjectBreakdown: SubjectStats[];
  trendChartData: TrendDataPoint[];
  radarChartData: RadarDataPoint[];
  summary: {
    overallAverage: number;
    assessmentCount: number;
    trend: number;
    status: 'improving' | 'stable' | 'declining' | 'new';
    bestSubject: string | null;
    weakestSubject: string | null;
  };
}

export function useParentProgress(accessToken: string | undefined) {
  return useQuery({
    queryKey: ['parent-progress', accessToken],
    queryFn: async (): Promise<ParentProgressData> => {
      // Fetch marks using the secure RPC function
      const { data: marks, error } = await supabase
        .rpc('get_student_marks_by_access_token', { _access_token: accessToken });

      if (error) throw error;

      const markRecords = (marks || []) as MarkRecord[];

      if (markRecords.length === 0) {
        return {
          assessments: [],
          subjectBreakdown: [],
          trendChartData: [],
          radarChartData: [],
          summary: {
            overallAverage: 0,
            assessmentCount: 0,
            trend: 0,
            status: 'new',
            bestSubject: null,
            weakestSubject: null,
          },
        };
      }

      // Group marks by assessment
      const assessmentMap = new Map<string, AssessmentResult>();
      
      for (const mark of markRecords) {
        if (!assessmentMap.has(mark.assessment_id)) {
          assessmentMap.set(mark.assessment_id, {
            id: mark.assessment_id,
            name: mark.assessment_name,
            type: mark.assessment_type,
            date: mark.assessment_date,
            overallPercentage: 0,
            subjects: [],
          });
        }
        
        const assessment = assessmentMap.get(mark.assessment_id)!;
        assessment.subjects.push({
          id: mark.subject_id,
          name: mark.subject_name,
          code: mark.subject_code,
          marksObtained: Number(mark.marks_obtained),
          maxMarks: Number(mark.max_marks),
          percentage: mark.max_marks > 0 
            ? Math.round((Number(mark.marks_obtained) / Number(mark.max_marks)) * 100) 
            : 0,
        });
      }

      // Calculate overall percentage for each assessment
      const assessments: AssessmentResult[] = [];
      for (const [, assessment] of assessmentMap) {
        const totalObtained = assessment.subjects.reduce((sum, s) => sum + s.marksObtained, 0);
        const totalMax = assessment.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
        assessment.overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        assessments.push(assessment);
      }

      // Sort assessments by date (newest first for display, but we need oldest first for trend)
      assessments.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Calculate subject breakdown
      const subjectMap = new Map<string, { total: number; count: number; name: string; code: string | null }>();
      
      for (const mark of markRecords) {
        if (!subjectMap.has(mark.subject_id)) {
          subjectMap.set(mark.subject_id, {
            total: 0,
            count: 0,
            name: mark.subject_name,
            code: mark.subject_code,
          });
        }
        const subject = subjectMap.get(mark.subject_id)!;
        const percentage = mark.max_marks > 0 
          ? (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100 
          : 0;
        subject.total += percentage;
        subject.count += 1;
      }

      const subjectBreakdown: SubjectStats[] = [];
      for (const [id, data] of subjectMap) {
        subjectBreakdown.push({
          id,
          name: data.name,
          code: data.code,
          averagePercentage: Math.round(data.total / data.count),
          assessmentCount: data.count,
        });
      }

      // Sort by average percentage descending
      subjectBreakdown.sort((a, b) => b.averagePercentage - a.averagePercentage);

      // Prepare trend chart data (oldest to newest for proper trend visualization)
      const trendChartData: TrendDataPoint[] = [...assessments]
        .reverse()
        .map(a => ({
          name: a.name,
          percentage: a.overallPercentage,
          date: a.date || undefined,
        }));

      // Prepare radar chart data
      const radarChartData: RadarDataPoint[] = subjectBreakdown.map(s => ({
        subject: s.name,
        student: s.averagePercentage,
      }));

      // Calculate summary
      const overallAverage = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + a.overallPercentage, 0) / assessments.length)
        : 0;

      // Calculate trend (compare last 2 assessments if available)
      let trend = 0;
      let status: 'improving' | 'stable' | 'declining' | 'new' = 'new';
      
      if (assessments.length >= 2) {
        // assessments[0] is newest, assessments[1] is second newest
        trend = assessments[0].overallPercentage - assessments[1].overallPercentage;
        
        if (trend > 5) {
          status = 'improving';
        } else if (trend < -5) {
          status = 'declining';
        } else {
          status = 'stable';
        }
      } else if (assessments.length === 1) {
        status = 'new';
      }

      const bestSubject = subjectBreakdown.length > 0 ? subjectBreakdown[0].name : null;
      const weakestSubject = subjectBreakdown.length > 0 ? subjectBreakdown[subjectBreakdown.length - 1].name : null;

      return {
        assessments,
        subjectBreakdown,
        trendChartData,
        radarChartData,
        summary: {
          overallAverage,
          assessmentCount: assessments.length,
          trend,
          status,
          bestSubject,
          weakestSubject: subjectBreakdown.length > 1 ? weakestSubject : null,
        },
      };
    },
    enabled: !!accessToken,
  });
}
