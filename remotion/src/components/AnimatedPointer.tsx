import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface AnimatedPointerProps {
  x: number;
  y: number;
  clickAtFrame?: number;
}

export const AnimatedPointer: React.FC<AnimatedPointerProps> = ({ x, y, clickAtFrame = 15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const moveProgress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const px = interpolate(moveProgress, [0, 1], [x - 80, x]);
  const py = interpolate(moveProgress, [0, 1], [y + 60, y]);
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const isClicking = frame >= clickAtFrame && frame <= clickAtFrame + 6;
  const clickScale = isClicking ? 0.85 : 1;

  const rippleOpacity =
    frame >= clickAtFrame
      ? interpolate(frame, [clickAtFrame, clickAtFrame + 20], [0.5, 0], { extrapolateRight: "clamp" })
      : 0;
  const rippleScale =
    frame >= clickAtFrame
      ? interpolate(frame, [clickAtFrame, clickAtFrame + 20], [0, 1], { extrapolateRight: "clamp" })
      : 0;

  return (
    <div style={{ position: "absolute", left: px, top: py, opacity, pointerEvents: "none", zIndex: 1000 }}>
      {/* Click ripple */}
      <div
        style={{
          position: "absolute",
          left: -20,
          top: -20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(99, 102, 241, 0.4)",
          transform: `scale(${rippleScale * 2.5})`,
          opacity: rippleOpacity,
        }}
      />
      {/* Cursor */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        style={{ transform: `scale(${clickScale})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
      >
        <path d="M5 3l14 9-6 1.5L9 20z" fill="#fff" stroke="#333" strokeWidth="1" />
      </svg>
    </div>
  );
};
