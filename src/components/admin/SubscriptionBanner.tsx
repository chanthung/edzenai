import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SystemState } from "@/hooks/useSubscriptionStatus";

interface SubscriptionBannerProps {
  effectiveState: SystemState;
  daysRemaining: number | null;
  className?: string;
}

export function SubscriptionBanner({ effectiveState, daysRemaining, className }: SubscriptionBannerProps) {
  // Don't show banner for active subscriptions
  if (effectiveState === 'subscription_active') {
    return null;
  }

  // Show trial expiring soon warning (within 7 days)
  if (effectiveState === 'trial_active' && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className={cn(
        "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg flex items-center gap-3",
        className
      )}>
        <Clock className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Trial expiring soon</p>
          <p className="text-sm opacity-90">
            Your trial ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. 
            Contact your administrator to activate your subscription.
          </p>
        </div>
      </div>
    );
  }

  // Show trial expired / restricted mode warning
  if (effectiveState === 'trial_expired' || effectiveState === 'restricted_mode') {
    return (
      <div className={cn(
        "bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3",
        className
      )}>
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Trial Expired - Restricted Mode</p>
          <p className="text-sm opacity-90">
            Your trial has expired. Some features are restricted. 
            Contact your administrator to activate your subscription.
          </p>
        </div>
      </div>
    );
  }

  // Show trial active with days remaining
  if (effectiveState === 'trial_active' && daysRemaining !== null && daysRemaining > 7) {
    return (
      <div className={cn(
        "bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg flex items-center gap-3",
        className
      )}>
        <CheckCircle className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Trial Active</p>
          <p className="text-sm opacity-90">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining in your trial period.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
