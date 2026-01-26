import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SystemState = 'trial_active' | 'trial_expired' | 'subscription_active' | 'restricted_mode';

export interface SubscriptionInfo {
  trialStartDate: string | null;
  trialEndDate: string | null;
  systemState: SystemState;
  paymentVerified: boolean;
  paymentVerifiedAt: string | null;
  subscriptionStatus: string | null;
  subscriptionType: string | null;
  daysRemaining: number | null;
  isRestricted: boolean;
  effectiveState: SystemState;
}

type RestrictedAction = 
  | 'add_student'
  | 'edit_student'
  | 'record_payment'
  | 'add_fee_structure'
  | 'verify_proof'
  | 'generate_parent_link'
  | 'modify_settings'
  | 'add_academic_year';

const RESTRICTED_ACTIONS: RestrictedAction[] = [
  'add_student',
  'edit_student',
  'record_payment',
  'add_fee_structure',
  'verify_proof',
  'generate_parent_link',
  'modify_settings',
  'add_academic_year',
];

function calculateEffectiveState(school: {
  trial_end_date: string | null;
  payment_verified: boolean | null;
  subscription_status: string | null;
  system_state: string | null;
}): SystemState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // If payment verified and subscription active
  if (school.payment_verified && school.subscription_status === 'active') {
    return 'subscription_active';
  }
  
  // If no trial end date or within trial period
  if (!school.trial_end_date) {
    return 'trial_active';
  }
  
  const trialEnd = new Date(school.trial_end_date);
  trialEnd.setHours(0, 0, 0, 0);
  
  if (today <= trialEnd) {
    return 'trial_active';
  }
  
  // Trial has expired
  return 'trial_expired';
}

function calculateDaysRemaining(trialEndDate: string | null): number | null {
  if (!trialEndDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(trialEndDate);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function useSubscriptionStatus() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      // Get the user's school
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select(`
          id,
          trial_start_date,
          trial_end_date,
          system_state,
          payment_verified,
          payment_verified_at,
          subscription_status,
          subscription_type
        `)
        .limit(1)
        .maybeSingle();

      if (schoolError) throw schoolError;
      if (!schoolData) return null;

      const effectiveState = calculateEffectiveState({
        trial_end_date: schoolData.trial_end_date,
        payment_verified: schoolData.payment_verified,
        subscription_status: schoolData.subscription_status,
        system_state: schoolData.system_state as string | null,
      });

      const daysRemaining = calculateDaysRemaining(schoolData.trial_end_date);
      const isRestricted = effectiveState === 'trial_expired' || effectiveState === 'restricted_mode';

      return {
        trialStartDate: schoolData.trial_start_date,
        trialEndDate: schoolData.trial_end_date,
        systemState: (schoolData.system_state as SystemState) || 'trial_active',
        paymentVerified: schoolData.payment_verified || false,
        paymentVerifiedAt: schoolData.payment_verified_at,
        subscriptionStatus: schoolData.subscription_status,
        subscriptionType: schoolData.subscription_type,
        daysRemaining,
        isRestricted,
        effectiveState,
      };
    },
    enabled: !!user,
  });

  const canPerform = (action: RestrictedAction): boolean => {
    if (!data) return true; // Allow if no data yet
    if (!data.isRestricted) return true;
    return !RESTRICTED_ACTIONS.includes(action);
  };

  const getRestrictionMessage = (): string => {
    if (!data?.isRestricted) return '';
    return 'Your trial has expired. Some features are restricted. Contact your administrator to activate your subscription.';
  };

  return {
    subscriptionInfo: data,
    isLoading,
    error,
    refetch,
    isRestricted: data?.isRestricted || false,
    effectiveState: data?.effectiveState || 'trial_active',
    daysRemaining: data?.daysRemaining,
    canPerform,
    getRestrictionMessage,
  };
}

export type { RestrictedAction };
