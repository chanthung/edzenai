import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CalEmbedProps {
  /** Cal.com booking path, e.g. "edzenai-lwnjxm/15min" */
  calLink?: string;
  /** Optional prefill — appended as query params */
  name?: string;
  email?: string;
  /** Iframe height in px (clamped between 600–800 by spec) */
  height?: number;
  className?: string;
}

const DEFAULT_CAL_LINK = "edzenai-lwnjxm/15min";

/**
 * Responsive Cal.com booking embed.
 * Full width, height 600–800px, supports name/email prefill.
 */
export const CalEmbed = ({
  calLink = DEFAULT_CAL_LINK,
  name,
  email,
  height = 720,
  className,
}: CalEmbedProps) => {
  const src = useMemo(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    params.set("embed", "true");
    const qs = params.toString();
    return `https://cal.com/${calLink}${qs ? `?${qs}` : ""}`;
  }, [calLink, name, email]);

  const safeHeight = Math.min(800, Math.max(600, height));

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm", className)}>
      <iframe
        src={src}
        title="Book a demo with EdZen AI"
        loading="lazy"
        allow="camera; microphone; autoplay; clipboard-write"
        className="w-full block"
        style={{ height: safeHeight, border: 0 }}
      />
    </div>
  );
};

export const CAL_BOOKING_URL = `https://cal.com/${DEFAULT_CAL_LINK}`;

/** Build an external booking link with optional prefill. */
export const buildCalUrl = (opts?: { name?: string; email?: string; calLink?: string }) => {
  const link = opts?.calLink ?? DEFAULT_CAL_LINK;
  const params = new URLSearchParams();
  if (opts?.name) params.set("name", opts.name);
  if (opts?.email) params.set("email", opts.email);
  const qs = params.toString();
  return `https://cal.com/${link}${qs ? `?${qs}` : ""}`;
};

export default CalEmbed;
