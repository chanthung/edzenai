import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DraftRecoveryBannerProps {
  savedAt: number;
  onRestore: () => void;
  onDismiss: () => void;
  className?: string;
}

function formatTime(ts: number) {
  const date = new Date(ts);
  const sameDay = new Date().toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DraftRecoveryBanner({
  savedAt,
  onRestore,
  onDismiss,
  className,
}: DraftRecoveryBannerProps) {
  return (
    <div
      role="region"
      aria-label="Draft recovery"
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        "rounded-xl border border-primary/20 bg-primary/5 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 shrink-0">
          <History className="h-4 w-4 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">
            We saved a draft from {formatTime(savedAt)}.
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Want to restore your unsaved changes?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Button size="sm" onClick={onRestore}>
          Restore
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
          <X className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
