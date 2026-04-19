import { useEffect, useState } from "react";
import { Check, CloudOff, Loader2, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutoSaveStatus } from "@/lib/auto-save/types";

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSavedAt: number | null;
  /** When true, on small screens the indicator is rendered as a fixed bottom strip. */
  mobileFixed?: boolean;
  className?: string;
}

function formatRelative(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  const day = Math.round(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  mobileFixed = true,
  className,
}: AutoSaveIndicatorProps) {
  // Tick every 15s to refresh "X mins ago" copy.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Don't render anything in 'idle' before any activity.
  if (status === "idle" && !lastSavedAt) return null;

  const { label, Icon, tone } = (() => {
    switch (status) {
      case "saving":
        return { label: "Saving…", Icon: Loader2, tone: "saving" as const };
      case "dirty":
        return { label: "Unsaved changes", Icon: Cloud, tone: "dirty" as const };
      case "error":
        return { label: "Retrying…", Icon: CloudOff, tone: "dirty" as const };
      case "saved":
      case "idle":
      default:
        return {
          label: lastSavedAt
            ? `Saved ${formatRelative(lastSavedAt)}`
            : "Saved",
          Icon: Check,
          tone: "saved" as const,
        };
    }
  })();

  const toneClasses = {
    saving:
      "bg-primary/10 text-primary border-primary/20",
    dirty:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900",
    saved:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900",
  }[tone];

  const pill = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        toneClasses,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn("h-3.5 w-3.5", status === "saving" && "animate-spin")}
        aria-hidden
      />
      {label}
    </span>
  );

  if (!mobileFixed) return pill;

  return (
    <>
      {/* Desktop / tablet: inline pill */}
      <span className="hidden sm:inline-flex">{pill}</span>
      {/* Mobile: fixed bottom strip, subtle, non-blocking */}
      <div
        className={cn(
          "sm:hidden fixed left-1/2 -translate-x-1/2 bottom-20 z-40 pointer-events-none",
          "transition-opacity duration-300",
          status === "idle" ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="pointer-events-auto shadow-md rounded-full">
          {pill}
        </div>
      </div>
    </>
  );
}

/** Small muted line for "Last saved: X ago" beneath a Save button. */
export function LastSavedLabel({ lastSavedAt }: { lastSavedAt: number | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  if (!lastSavedAt) return null;
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Last saved: {formatRelative(lastSavedAt)}
    </p>
  );
}
