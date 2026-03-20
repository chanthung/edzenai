import { createContext, useContext, ReactNode } from 'react';
import { useSubscriptionStatus, RestrictedAction, SystemState } from '@/hooks/useSubscriptionStatus';
import type { SubscriptionPlan, PlanFeature } from '@/config/plan-features';

interface RestrictionContextValue {
  isRestricted: boolean;
  effectiveState: SystemState;
  currentPlan: SubscriptionPlan;
  daysRemaining: number | null;
  canPerform: (action: RestrictedAction) => boolean;
  canAccessFeature: (feature: PlanFeature) => boolean;
  getRestrictionMessage: () => string;
}

const RestrictionContext = createContext<RestrictionContextValue | undefined>(undefined);

interface RestrictionProviderProps {
  children: ReactNode;
}

export function RestrictionProvider({ children }: RestrictionProviderProps) {
  const {
    isRestricted,
    effectiveState,
    currentPlan,
    daysRemaining,
    canPerform,
    canAccessFeature,
    getRestrictionMessage,
  } = useSubscriptionStatus();

  return (
    <RestrictionContext.Provider
      value={{
        isRestricted,
        effectiveState,
        currentPlan,
        daysRemaining,
        canPerform,
        canAccessFeature,
        getRestrictionMessage,
      }}
    >
      {children}
    </RestrictionContext.Provider>
  );
}

export function useRestriction() {
  const context = useContext(RestrictionContext);
  if (context === undefined) {
    throw new Error('useRestriction must be used within a RestrictionProvider');
  }
  return context;
}

export type { RestrictedAction, PlanFeature };
