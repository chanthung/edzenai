import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessFeature as checkFeatureAccess, type SubscriptionPlan, type PlanFeature } from '@/config/plan-features';

export type SystemState = 'trial_active' | 'trial_expired' | 'subscription_active' | 'restricted_mode';

export interface SubscriptionInfo {
  trialStartDate: string | null;
  trialEndDate: string | null;
  systemState: SystemState;
  paymentVerified: boolean;
  paymentVerifiedAt: string | null;
  subscriptionStatus: string | null;
  subscriptionType: string | null;
  subscriptionPlan: SubscriptionPlan;
  daysRemaining: number | null;
  isRestricted: boolean;
  effectiveState: SystemState;
}

type RestrictedAction = 
  | 'add_student'
  | 'edit_student'
  | 'delete_student'
  | 'record_payment'
  | 'delete_payment'
  | 'add_fee_structure'
  | 'delete_fee_structure'
  | 'assign_fee_structure'
  | 'remove_fee_structure'
  | 'add_installment'
  | 'edit_installment'
  | 'delete_installment'
  | 'add_fee_category'
  | 'delete_fee_category'
  | 'add_academic_year'
  | 'delete_academic_year'
  | 'update_academic_year'
  | 'verify_proof'
  | 'reject_proof'
  | 'generate_parent_link'
  | 'update_school_settings'
  | 'upload_qr_code'
  | 'change_password';

const RESTRICTED_ACTIONS: RestrictedAction[] = [
  'add_student',
  'edit_student',
  'delete_student',
  'record_payment',
  'delete_payment',
  'add_fee_structure',
  'delete_fee_structure',
  'assign_fee_structure',
  'remove_fee_structure',
  'add_installment',
  'edit_installment',
  'delete_installment',
  'add_fee_category',
  'delete_fee_category',
  'add_academic_year',
  'delete_academic_year',
  'update_academic_year',
  'verify_proof',
  'reject_proof',
  'generate_parent_link',
  'update_school_settings',
  'upload_qr_code',
  'change_password',
];

function calculateEffectiveState(school: {
  trial_end_date: string | null;
  payment_verified: boolean | null;
  subscription_status: string | null;
  system_state: string | null;
}): SystemState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (school.payment_verified === true && school.system_state === 'subscription_active') {
    return 'subscription_active';
  }
  
  if (!school.trial_end_date) {
    return 'trial_active';
  }
  
  const trialEnd = new Date(school.trial_end_date);
  trialEnd.setHours(0, 0, 0, 0);
  
  if (today <= trialEnd) {
    return 'trial_active';
  }
  
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
  const managedSchoolId = useManagedSchoolId();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-status', user?.id, managedSchoolId],
    queryFn: async (): Promise<SubscriptionInfo | null> => {
      let query = supabase
        .from('schools')
        .select(`
          id,
          trial_start_date,
          trial_end_date,
          system_state,
          payment_verified,
          payment_verified_at,
          subscription_status,
          subscription_type,
          subscription_plan
        `);

      if (managedSchoolId) query = query.eq('id', managedSchoolId);

      const { data: schoolData, error: schoolError } = await query
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
        subscriptionPlan: ((schoolData as any).subscription_plan as SubscriptionPlan) || 'starter',
        daysRemaining,
        isRestricted,
        effectiveState,
      };
    },
    enabled: !!user,
  });

  const canPerform = (action: RestrictedAction): boolean => {
    if (!data) return true;
    if (!data.isRestricted) return true;
    return !RESTRICTED_ACTIONS.includes(action);
  };

  const canAccessFeature = (feature: PlanFeature): boolean => {
    if (!data) return true; // Allow if no data yet
    return checkFeatureAccess(data.subscriptionPlan, feature);
  };

  const getRestrictionMessage = (): string => {
    if (!data?.isRestricted) return '';
    if (data?.subscriptionPlan === 'pro') {
      return 'Your Pro trial has expired. You\'ve been downgraded to Starter. Upgrade to continue using Pro features.';
    }
    return 'Upgrade to Pro to unlock advanced features like AI insights, report cards, and more.';
  };

  return {
    subscriptionInfo: data,
    isLoading,
    error,
    refetch,
    isRestricted: data?.isRestricted || false,
    effectiveState: data?.effectiveState || 'trial_active',
    currentPlan: data?.subscriptionPlan || 'starter' as SubscriptionPlan,
    daysRemaining: data?.daysRemaining,
    canPerform,
    canAccessFeature,
    getRestrictionMessage,
  };
}

export type { RestrictedAction, SubscriptionPlan, PlanFeature };
