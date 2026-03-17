import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComponentMark {
  id: string;
  student_mark_id: string;
  component_id: string;
  marks_obtained: number;
}

/**
 * Fetch component marks for a set of student_mark IDs
 */
export function useComponentMarks(studentMarkIds: string[]) {
  return useQuery({
    queryKey: ['component-marks', studentMarkIds],
    queryFn: async () => {
      if (studentMarkIds.length === 0) return [];
      const { data, error } = await supabase
        .from('component_marks')
        .select('*')
        .in('student_mark_id', studentMarkIds);
      if (error) throw error;
      return data as ComponentMark[];
    },
    enabled: studentMarkIds.length > 0,
  });
}
