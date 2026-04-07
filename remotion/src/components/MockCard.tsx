import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface MockCardProps {
  title: string;
  value: string;
  color?: string;
  delay?: number;
}

export const MockCard: React.FC<MockCardProps> = ({ title, value, color = "#6366f1", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 150 } });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "24px 28px",
        border: "1px solid rgba(255,255,255,0.1)",
        transform: `scale(${scale})`,
        opacity,
        flex: 1,
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif", fontWeight: 500, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "sans-serif" }}>{value}</div>
    </div>
  );
};
