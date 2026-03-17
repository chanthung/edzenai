import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type MasteryLevel = 'beginning' | 'developing' | 'proficient' | 'advanced';

export interface CompetencyScore {
  id: string;
  student_id: string;
  competency_id: string;
  assessment_id: string;
  mastery_level: MasteryLevel;
  score: number | null;
  remarks: string | null;
  created_at: string;
}

export function useCompetencyScores(assessmentId?: string, subjectId?: string) {
  return useQuery({
    queryKey: ['competency-scores', assessmentId, subjectId],
    queryFn: async () => {
      if (!assessmentId) return [];
      let query = supabase
        .from('student_competency_scores')
        .select('*, competencies!inner(subject_id)')
        .eq('assessment_id', assessmentId);
      if (subjectId) {
        query = query.eq('competencies.subject_id', subjectId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as (CompetencyScore & { competencies: { subject_id: string } })[];
    },
    enabled: !!assessmentId,
  });
}

export function useStudentCompetencyScores(studentId?: string) {
  return useQuery({
    queryKey: ['student-competency-scores', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_competency_scores')
        .select('*, competencies!inner(id, name, subject_id, subjects!inner(name))')
        .eq('student_id', studentId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!studentId,
  });
}

export function useSaveCompetencyScores() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scores: Array<{
      student_id: string;
      competency_id: string;
      assessment_id: string;
      mastery_level: MasteryLevel;
      remarks?: string;
    }>) => {
      if (scores.length === 0) return;
      // Upsert based on unique constraint (student_id, competency_id, assessment_id)
      const { error } = await supabase
        .from('student_competency_scores')
        .upsert(
          scores.map(s => ({
            student_id: s.student_id,
            competency_id: s.competency_id,
            assessment_id: s.assessment_id,
            mastery_level: s.mastery_level,
            remarks: s.remarks || null,
          })),
          { onConflict: 'student_id,competency_id,assessment_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competency-scores'] });
      qc.invalidateQueries({ queryKey: ['student-competency-scores'] });
      toast({ title: 'Competency scores saved' });
    },
    onError: (e) => toast({ title: 'Failed to save competency scores', description: e.message, variant: 'destructive' }),
  });
}
