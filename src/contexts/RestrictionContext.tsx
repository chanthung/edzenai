import { createContext, useContext, ReactNode } from 'react';
import { useSubscriptionStatus, RestrictedAction, SystemState } from '@/hooks/useSubscriptionStatus';

interface RestrictionContextValue {
  isRestricted: boolean;
  effectiveState: SystemState;
  daysRemaining: number | null;
  canPerform: (action: RestrictedAction) => boolean;
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
    daysRemaining,
    canPerform,
    getRestrictionMessage,
  } = useSubscriptionStatus();

  return (
    <RestrictionContext.Provider
      value={{
        isRestricted,
        effectiveState,
        daysRemaining,
        canPerform,
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

// Re-export the type for convenience
export type { RestrictedAction };
