import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface SectionTitleProps {
  number: string;
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ number, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({ frame, fps, config: { damping: 18 } });
  const textOpacity = interpolate(frame, [5, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const textY = interpolate(spring({ frame: frame - 5, fps, config: { damping: 22 } }), [0, 1], [15, 0]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: 10,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "sans-serif",
          transform: `scale(${badgeScale})`,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "sans-serif",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {title}
      </div>
    </div>
  );
};
