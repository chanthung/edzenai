import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ProgressStatus = "improving" | "stable" | "declining" | "new";

interface ProgressIndicatorProps {
  status: ProgressStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  improving: {
    icon: TrendingUp,
    label: "Improving",
    className: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  },
  stable: {
    icon: Minus,
    label: "Stable",
    className: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  declining: {
    icon: TrendingDown,
    label: "Declining",
    className: "text-red-600 bg-red-100 dark:bg-red-900/30",
  },
  new: {
    icon: HelpCircle,
    label: "New",
    className: "text-muted-foreground bg-muted",
  },
};

const sizeConfig = {
  sm: {
    container: "h-7 px-2 gap-1.5",
    icon: "h-3.5 w-3.5",
    text: "text-xs",
  },
  md: {
    container: "h-8 px-3 gap-2",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    container: "h-10 px-4 gap-2",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

export function ProgressIndicator({
  status,
  size = "md",
  showLabel = true,
}: ProgressIndicatorProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const indicator = (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.className,
        sizes.container
      )}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span className={sizes.text}>{config.label}</span>}
    </div>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return indicator;
}
