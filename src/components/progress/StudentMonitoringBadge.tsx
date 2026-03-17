import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type MonitoringLevel = "healthy" | "watch" | "needs_attention" | "critical";

export interface MonitoringInfo {
  level: MonitoringLevel;
  reasons: string[];
}

interface StudentMonitoringBadgeProps {
  info: MonitoringInfo;
  compact?: boolean;
  className?: string;
}

const levelConfig: Record<MonitoringLevel, { icon: typeof AlertTriangle; label: string; className: string }> = {
  healthy: {
    icon: CheckCircle,
    label: "Healthy",
    className: "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
  },
  watch: {
    icon: AlertCircle,
    label: "Watch",
    className: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  },
  needs_attention: {
    icon: AlertTriangle,
    label: "Needs Attention",
    className: "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30",
  },
  critical: {
    icon: AlertTriangle,
    label: "Critical",
    className: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30",
  },
};

export function computeMonitoringInfo(student: {
  averagePercentage: number;
  status: string;
  trend: number;
  assessmentCount: number;
  totalAssessmentsAvailable?: number;
  subjectBreakdown: Array<{ averagePercentage: number; subjectName: string }>;
}): MonitoringInfo {
  const reasons: string[] = [];

  // Check low overall score
  if (student.averagePercentage < 35) {
    reasons.push("Overall score critically low (<35%)");
  } else if (student.averagePercentage < 50) {
    reasons.push("Overall score below 50%");
  }

  // Check declining trend
  if (student.status === "declining") {
    if (student.trend <= -15) {
      reasons.push(`Sharp decline (${student.trend}% drop)`);
    } else {
      reasons.push(`Declining trend (${student.trend}% drop)`);
    }
  }

  // Check for weak subjects (<40%)
  const weakSubjects = student.subjectBreakdown.filter(s => s.averagePercentage < 40);
  if (weakSubjects.length > 0) {
    reasons.push(`Weak in: ${weakSubjects.map(s => s.subjectName).join(", ")}`);
  }

  // Check for missing assessments
  if (student.totalAssessmentsAvailable && student.totalAssessmentsAvailable > 0) {
    const missing = student.totalAssessmentsAvailable - student.assessmentCount;
    if (missing > 0) {
      reasons.push(`Missing ${missing} assessment${missing > 1 ? "s" : ""}`);
    }
  } else if (student.assessmentCount === 0) {
    reasons.push("No assessments recorded");
  }

  // Determine level
  let level: MonitoringLevel = "healthy";
  if (reasons.length === 0) {
    level = "healthy";
  } else if (student.averagePercentage < 35 || (student.status === "declining" && student.trend <= -15)) {
    level = "critical";
  } else if (student.averagePercentage < 50 || student.status === "declining" || weakSubjects.length >= 2) {
    level = "needs_attention";
  } else {
    level = "watch";
  }

  return { level, reasons };
}

export function StudentMonitoringBadge({ info, compact = false, className }: StudentMonitoringBadgeProps) {
  const config = levelConfig[info.level];
  const Icon = config.icon;

  if (info.level === "healthy" && compact) return null;

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {!compact && <span>{config.label}</span>}
    </div>
  );

  if (compact || info.reasons.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-semibold mb-1">{config.label}</p>
          {info.reasons.length > 0 ? (
            <ul className="text-xs space-y-0.5">
              {info.reasons.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs">Student is performing well</p>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
