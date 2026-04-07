import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface ChapterTitleProps {
  chapterNumber: number;
  title: string;
  subtitle: string;
}

export const ChapterTitle: React.FC<ChapterTitleProps> = ({ chapterNumber, title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const titleY = interpolate(spring({ frame: frame - 8, fps, config: { damping: 20 } }), [0, 1], [40, 0]);
  const titleOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineWidth = interpolate(spring({ frame: frame - 12, fps, config: { damping: 25 } }), [0, 1], [0, 300]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 40,
            padding: "10px 28px",
            marginBottom: 24,
            transform: `scale(${badgeScale})`,
          }}
        >
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 600, fontFamily: "sans-serif", letterSpacing: 2 }}>
            CHAPTER {chapterNumber}
          </span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#fff",
            fontFamily: "sans-serif",
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: "linear-gradient(90deg, #6366f1, #a78bfa)",
            margin: "20px auto",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "sans-serif",
            opacity: subOpacity,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
