import { useCurrentFrame, interpolate, useVideoConfig, spring } from "remotion";

interface MockTableProps {
  headers: string[];
  rows: string[][];
  delay?: number;
}

export const MockTable: React.FC<MockTableProps> = ({ headers, rows, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tableOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tableY = interpolate(spring({ frame: frame - delay, fps, config: { damping: 25 } }), [0, 1], [20, 0]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        opacity: tableOpacity,
        transform: `translateY(${tableY}px)`,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,0.06)",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {headers.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "sans-serif",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {h}
          </div>
        ))}
      </div>
      {/* Data rows */}
      {rows.map((row, ri) => {
        const rowDelay = delay + 10 + ri * 4;
        const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={ri}
            style={{
              display: "flex",
              padding: "12px 20px",
              borderBottom: ri < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              opacity: rowOpacity,
            }}
          >
            {row.map((cell, ci) => (
              <div key={ci} style={{ flex: 1, fontSize: 14, color: "rgba(255,255,255,0.85)", fontFamily: "sans-serif" }}>
                {cell}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
