import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  upi_id: string | null;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useSchool() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['school', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as School;
    },
    enabled: !!user,
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<School>) => {
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single();
      
      if (!school) throw new Error('School not found');
      
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', school.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', user?.id] });
    },
  });
}
