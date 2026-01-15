import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/lib/format";
import { Check, Clock, AlertCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: 'paid' | 'upcoming' | 'due' | 'overdue';
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusIcons = {
  paid: Check,
  upcoming: Clock,
  due: AlertTriangle,
  overdue: AlertCircle,
};

export function StatusBadge({ status, showIcon = true, size = 'md', className }: StatusBadgeProps) {
  const Icon = statusIcons[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        `status-${status}`,
        className
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {getStatusLabel(status)}
    </span>
  );
}
