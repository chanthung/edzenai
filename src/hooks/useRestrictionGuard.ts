import { useSubscriptionStatus, RestrictedAction } from './useSubscriptionStatus';

/**
 * Creates a guard function that throws an error if the school is restricted
 * and the action is not allowed.
 */
export function useRestrictionGuard() {
  const { isRestricted, canPerform, getRestrictionMessage } = useSubscriptionStatus();

  const guardAction = (action: RestrictedAction): void => {
    if (isRestricted && !canPerform(action)) {
      throw new Error(getRestrictionMessage() || 'Operation not permitted. School is in restricted mode.');
    }
  };

  return { guardAction, isRestricted, canPerform };
}
