import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertTriangle, Lock } from "lucide-react";
import type { SystemState } from "@/hooks/useSubscriptionStatus";

interface SystemStateBadgeProps {
  state: SystemState | string | null;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const stateConfig = {
  subscription_active: {
    label: "Active",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  trial_active: {
    label: "Trial",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  trial_expired: {
    label: "Expired",
    icon: AlertTriangle,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  restricted_mode: {
    label: "Restricted",
    icon: Lock,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export function SystemStateBadge({ state, showIcon = true, size = 'md', className }: SystemStateBadgeProps) {
  const config = stateConfig[state as keyof typeof stateConfig] || stateConfig.trial_active;
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {config.label}
    </span>
  );
}
