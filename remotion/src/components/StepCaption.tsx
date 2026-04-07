import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface StepCaptionProps {
  text: string;
  step?: number;
}

export const StepCaption: React.FC<StepCaptionProps> = ({ text, step }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = interpolate(spring({ frame, fps, config: { damping: 20, stiffness: 150 } }), [0, 1], [30, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${slideUp}px)`,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "none",
          borderRadius: 16,
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          maxWidth: 900,
        }}
      >
        {step !== undefined && (
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 20,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              fontFamily: "sans-serif",
              flexShrink: 0,
            }}
          >
            {step}
          </div>
        )}
        <span style={{ color: "#fff", fontSize: 22, fontFamily: "sans-serif", fontWeight: 500, lineHeight: 1.4 }}>
          {text}
        </span>
      </div>
    </div>
  );
};
