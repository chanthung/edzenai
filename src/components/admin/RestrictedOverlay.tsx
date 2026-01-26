import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RestrictedOverlayProps {
  isRestricted: boolean;
  children: ReactNode;
  message?: string;
  className?: string;
}

export function RestrictedOverlay({ 
  isRestricted, 
  children, 
  message = "This feature is restricted. Contact your administrator to activate your subscription.",
  className 
}: RestrictedOverlayProps) {
  if (!isRestricted) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative cursor-not-allowed", className)}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-lg z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full text-sm">
                <Lock className="h-3.5 w-3.5" />
                <span>Restricted</span>
              </div>
            </div>
            {/* Content (disabled) */}
            <div className="pointer-events-none opacity-50">
              {children}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface RestrictedButtonProps {
  isRestricted: boolean;
  children: ReactNode;
  message?: string;
}

export function RestrictedButton({ isRestricted, children, message }: RestrictedButtonProps) {
  if (!isRestricted) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <div className="pointer-events-none opacity-50">
              {children}
            </div>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{message || "This feature is restricted. Contact your administrator."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
