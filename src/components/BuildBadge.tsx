import { useLocation } from "react-router-dom";

const BUILD_ID = (import.meta.env.VITE_BUILD_ID as string) || "dev";
const BUILD_TIME = (import.meta.env.VITE_BUILD_TIME as string) || "";

/**
 * Tiny version badge fixed at bottom-right.
 * Hidden on parent view to keep the screen clean for parents.
 * Used by support: ask the user "what does the bottom-right say?"
 */
export function BuildBadge() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/view/")) return null;

  const date = BUILD_TIME ? BUILD_TIME.slice(0, 10) : "";
  const label = `v${BUILD_ID}${date ? " · " + date : ""}`;

  return (
    <div
      className="fixed bottom-1 right-2 z-[9999] text-[10px] leading-none text-muted-foreground/50 font-mono pointer-events-none select-none"
      title={`Build ${BUILD_ID}${BUILD_TIME ? "\n" + BUILD_TIME : ""}`}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}
