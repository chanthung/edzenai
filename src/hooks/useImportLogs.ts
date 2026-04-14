import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';

export interface ImportLog {
  id: string;
  school_id: string;
  imported_at: string;
  file_name: string;
  total_rows: number;
  imported_count: number;
  failed_count: number;
  ignored_columns: string[];
  issue_rows: any[];
  created_at: string;
}

export function useImportLogs() {
  const { data: school } = useSchool();

  return useQuery({
    queryKey: ['import-logs', school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data, error } = await supabase
        .from('import_logs' as any)
        .select('*')
        .eq('school_id', school.id)
        .order('imported_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as ImportLog[];
    },
    enabled: !!school?.id,
  });
}

export function useLatestImportLog() {
  const { data: logs, ...rest } = useImportLogs();
  return { data: logs?.[0] || null, ...rest };
}
