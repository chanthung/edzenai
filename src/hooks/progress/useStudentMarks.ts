import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import { useToast } from '@/hooks/use-toast';

export type GradeScale = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'E';

export interface StudentMark {
  id: string;
  student_id: string;
  assessment_id: string;
  subject_id: string;
  marks_obtained: number;
  max_marks: number;
  remarks: string | null;
  created_at: string | null;
  grade: GradeScale | null;
  qualitative_feedback: string | null;
  is_grade_based: boolean;
}

export interface StudentMarkWithDetails extends StudentMark {
  students?: {
    id: string;
    name: string;
    class_name: string | null;
    section: string | null;
    roll_number: string | null;
  };
  assessments?: {
    id: string;
    name: string;
    assessment_type: string;
    assessment_date: string | null;
    class_name: string | null;
  };
  subjects?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export function useStudentMarks(assessmentId?: string, studentId?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['student-marks', schoolId, assessmentId, studentId],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from('student_marks')
        .select(`
          *,
          students!inner(id, name, class_name, section, roll_number, school_id),
          assessments!inner(id, name, assessment_type, assessment_date, class_name, school_id),
          subjects!inner(id, name, code)
        `)
        .eq('students.school_id', schoolId);

      if (assessmentId) {
        query = query.eq('assessment_id', assessmentId);
      }

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StudentMarkWithDetails[];
    },
    enabled: !!schoolId,
  });
}

export function useStudentMarksByStudent(studentId: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['student-marks-by-student', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('student_marks')
        .select(`
          *,
          assessments!inner(id, name, assessment_type, assessment_date, class_name, academic_year_id),
          subjects!inner(id, name, code)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!studentId && !!schoolId,
  });
}

export function useSaveMarks() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      marks: Array<{
        student_id: string;
        assessment_id: string;
        subject_id: string;
        marks_obtained: number;
        max_marks: number;
        remarks?: string;
      }>
    ) => {
      const { data, error } = await supabase
        .from('student_marks')
        .upsert(
          marks.map((m) => ({
            student_id: m.student_id,
            assessment_id: m.assessment_id,
            subject_id: m.subject_id,
            marks_obtained: m.marks_obtained,
            max_marks: m.max_marks,
            remarks: m.remarks || null,
          })),
          { onConflict: 'student_id,assessment_id,subject_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-marks', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['student-marks-by-student'] });
      queryClient.invalidateQueries({ queryKey: ['class-progress'] });
      toast({ title: 'Marks saved successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to save marks',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteMark() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('student_marks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-marks', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['student-marks-by-student'] });
      queryClient.invalidateQueries({ queryKey: ['class-progress'] });
      toast({ title: 'Mark deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete mark',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
