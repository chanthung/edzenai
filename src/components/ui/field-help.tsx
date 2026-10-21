import * as React from "react";
import { Info, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared context-sensitive help patterns.
 *
 * - FieldHelp: on-demand info popover (works with mouse, keyboard focus and touch;
 *   rendered in a portal so it is never clipped by scrollable dialogs).
 * - FieldHint: short inline helper text beneath a field.
 * - SystemGenerated: indicator for values EdZenAI fills automatically.
 */

interface FieldHelpProps {
  /** Accessible name for the trigger button, e.g. "Help about Email Address". */
  label: string;
  /** Popover body: concise explanation, examples and suggested sources. */
  children: React.ReactNode;
  /** Optional contextual action (link/button) to an existing EdZenAI screen. */
  action?: React.ReactNode;
  className?: string;
}

export function FieldHelp({ label, children, action, className }: FieldHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full align-middle text-muted-foreground",
            "hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm space-y-2" collisionPadding={12}>
        <div className="space-y-1.5 text-muted-foreground">{children}</div>
        {action && <div className="pt-1">{action}</div>}
      </PopoverContent>
    </Popover>
  );
}

/** Short inline guidance shown beneath a field. */
export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}

/** Marks a value EdZenAI fills automatically and the user cannot edit. */
export function SystemGenerated({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("gap-1 font-normal", className)}>
      <Sparkles className="h-3 w-3" />
      {children ?? "Generated automatically"}
    </Badge>
  );
}
