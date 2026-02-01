import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AtRiskBadgeProps {
  showLabel?: boolean;
  className?: string;
}

export function AtRiskBadge({ showLabel = true, className }: AtRiskBadgeProps) {
  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
        className
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5" />
      {showLabel && <span>At Risk</span>}
    </div>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>At Risk - Needs attention</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
