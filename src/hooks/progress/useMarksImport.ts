import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useResolvedSchoolId } from './useResolvedSchoolId';

export type ImportMode = 'excel' | 'printed' | 'handwritten';

export interface PreviewRow {
  rowIndex: number;
  rawStudent: string;
  rawRoll: string;
  studentId: string | null;
  matchedStudentName: string | null;
  studentMatchConfidence: 'exact_roll' | 'exact_name' | 'fuzzy' | null;
  rawSubject: string;
  subjectId: string | null;
  matchedSubjectName: string | null;
  subjectMatchConfidence: 'exact' | 'alias' | 'fuzzy' | null;
  marksObtained: number | null;
  maxMarks: number | null;
  ocrConfidence?: 'high' | 'medium' | 'low';
  rawText?: string;
  reportedTotal?: number | null;
  recomputedTotal?: number | null;
  issues: string[];
  confidenceScore: number;
}

export interface PreviewResponse {
  rows: PreviewRow[];
  detectedHeaders: string[];
  ignoredColumns: string[];
  summary: {
    totalRows: number;
    matchedStudents: number;
    fuzzyStudents: number;
    unmatchedStudents: number;
    unmatchedSubjects: number;
    lowConfidence: number;
    avgConfidence: number;
    exceedsMax: number;
  };
  mode: ImportMode;
}

export interface KnownSubject { id: string; name: string; code: string | null }
export interface KnownStudent { id: string; name: string; roll_number: string | null }

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function useParseMarksImport() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      mode: ImportMode;
      file: File;
      knownSubjects: KnownSubject[];
      knownStudents: KnownStudent[];
      assessmentMaxBySubject?: Record<string, number>;
    }): Promise<PreviewResponse> => {
      const fileBase64 = await fileToBase64(input.file);
      const { data, error } = await supabase.functions.invoke('process-marks-import', {
        body: {
          mode: input.mode,
          fileBase64,
          fileName: input.file.name,
          mimeType: input.file.type,
          knownSubjects: input.knownSubjects,
          knownStudents: input.knownStudents,
          assessmentMaxBySubject: input.assessmentMaxBySubject ?? {},
        },
      });
      if (error) throw new Error(error.message || 'Failed to parse file');
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as PreviewResponse;
    },
    onError: (e) => {
      toast({ title: 'Could not import', description: e.message, variant: 'destructive' });
    },
  });
}

/** Look up existing marks for an assessment to detect duplicates pre-save. */
export function useExistingMarksForAssessment(assessmentId: string | null | undefined) {
  return useQuery({
    queryKey: ['existing-marks-for-import', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return new Map<string, number>();
      const { data, error } = await supabase
        .from('student_marks')
        .select('student_id, subject_id, marks_obtained')
        .eq('assessment_id', assessmentId);
      if (error) throw error;
      const m = new Map<string, number>();
      for (const r of data || []) {
        m.set(`${r.student_id}_${r.subject_id}`, Number(r.marks_obtained));
      }
      return m;
    },
    enabled: !!assessmentId,
    staleTime: 30_000,
  });
}

export function useLogMarksImport() {
  const { data: schoolId } = useResolvedSchoolId();
  return useMutation({
    mutationFn: async (input: {
      fileName: string;
      mode: ImportMode;
      total: number;
      saved: number;
      failed: number;
      ignoredColumns: string[];
      issueRows: unknown[];
    }) => {
      if (!schoolId) return;
      await supabase.from('import_logs' as any).insert({
        school_id: schoolId,
        file_name: input.fileName,
        total_rows: input.total,
        imported_count: input.saved,
        failed_count: input.failed,
        ignored_columns: input.ignoredColumns,
        issue_rows: input.issueRows as any,
        import_type: 'marks',
      } as any);
    },
  });
}
