import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { useManagedSchoolId, getManagedSchoolId } from '@/contexts/ManagedSchoolContext';

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
  // Plan field
  subscription_plan: string;
  custom_per_student_fee: number | null;
  discount_percent: number;
  // Subscription fields
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_renewal_date: string | null;
  // Trial fields
  trial_start_date: string | null;
  trial_end_date: string | null;
  system_state: string | null;
  payment_verified: boolean | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  // Curriculum
  board: string | null;
  // Onboarding defaults
  default_classes: string[] | null;
  default_sections: string[] | null;
  onboarding_completed: boolean;
}

export function useSchool() {
  const { user } = useAuth();
  const managedSchoolId = useManagedSchoolId();
  
  return useQuery({
    queryKey: ['school', user?.id, managedSchoolId],
    queryFn: async () => {
      let query = supabase.from('schools').select('*');
      if (managedSchoolId) query = query.eq('id', managedSchoolId);

      const { data, error } = await query.limit(1).single();
      
      if (error) throw error;
      return data as School;
    },
    enabled: !!user,
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (updates: Partial<Omit<School, 'system_state'>> & { system_state?: 'trial_active' | 'trial_expired' | 'subscription_active' | 'restricted_mode' }) => {
      // Only check restriction for non-system state updates
      const isSystemUpdate = 'system_state' in updates || 'payment_verified' in updates || 'subscription_status' in updates;
      if (!isSystemUpdate && isRestricted && !canPerform('update_school_settings')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
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
      queryClient.invalidateQueries({ queryKey: ['subscription-status', user?.id] });
    },
  });
}
