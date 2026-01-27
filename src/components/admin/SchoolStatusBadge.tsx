import { Lock, CheckCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SystemState } from "@/hooks/useSubscriptionStatus";

interface SchoolStatusBadgeProps {
  effectiveState: SystemState;
  className?: string;
}

export function SchoolStatusBadge({ effectiveState, className }: SchoolStatusBadgeProps) {
  const isRestricted = effectiveState === 'trial_expired' || effectiveState === 'restricted_mode';
  
  if (effectiveState === 'subscription_active') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400 gap-1.5",
                className
              )}
            >
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Subscription active. All features enabled.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isRestricted) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "border-destructive/50 bg-destructive/10 text-destructive gap-1.5",
                className
              )}
            >
              <Lock className="h-3 w-3" />
              Inactive (View Only)
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>This school is inactive. Editing and actions are disabled. Contact your administrator to activate subscription.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Trial active
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 gap-1.5",
              className
            )}
          >
            <Clock className="h-3 w-3" />
            Trial
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Trial period active. All features enabled.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
