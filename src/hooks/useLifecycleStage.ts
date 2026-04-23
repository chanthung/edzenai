import { useSubscriptionStatus } from './useSubscriptionStatus';

export type LifecycleStage =
  | 'trial_active'
  | 'subscription_active'
  | 'grace_period'
  | 'warning_phase'
  | 'suspended'
  | 'terminated'
  | 'trial_expired'
  | 'restricted_mode';

export interface LifecycleInfo {
  stage: LifecycleStage;
  daysIntoExpiry: number;
  daysRemainingInStage: number;
  isHardLocked: boolean; // suspended or terminated
  isWarning: boolean;    // warning_phase
  isGrace: boolean;      // grace_period
}

function computeFromAnchor(anchorDate: string | null): { daysIntoExpiry: number } {
  if (!anchorDate) return { daysIntoExpiry: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = new Date(anchorDate);
  anchor.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - anchor.getTime()) / 86400000);
  return { daysIntoExpiry: Math.max(0, days) };
}

export function useLifecycleStage(): LifecycleInfo {
  const { effectiveState, subscriptionInfo } = useSubscriptionStatus();
  const anchor = subscriptionInfo?.trialEndDate || null;
  const { daysIntoExpiry } = computeFromAnchor(anchor);

  // Map legacy states to lifecycle equivalents
  let stage = effectiveState as LifecycleStage;
  if (stage === 'trial_expired' || stage === 'restricted_mode') {
    if (daysIntoExpiry <= 15) stage = 'grace_period';
    else if (daysIntoExpiry <= 30) stage = 'warning_phase';
    else if (daysIntoExpiry <= 89) stage = 'suspended';
    else stage = 'terminated';
  }

  let daysRemainingInStage = 0;
  switch (stage) {
    case 'grace_period': daysRemainingInStage = Math.max(0, 15 - daysIntoExpiry); break;
    case 'warning_phase': daysRemainingInStage = Math.max(0, 30 - daysIntoExpiry); break;
    case 'suspended': daysRemainingInStage = Math.max(0, 89 - daysIntoExpiry); break;
    case 'terminated': daysRemainingInStage = 30; break;
  }

  return {
    stage,
    daysIntoExpiry,
    daysRemainingInStage,
    isHardLocked: stage === 'suspended' || stage === 'terminated',
    isWarning: stage === 'warning_phase',
    isGrace: stage === 'grace_period',
  };
}
