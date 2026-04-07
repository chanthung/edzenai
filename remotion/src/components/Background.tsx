import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const hueShift = interpolate(frame, [0, 900], [0, 10], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${230 + hueShift}, 25%, 12%) 0%, hsl(${250 + hueShift}, 30%, 18%) 50%, hsl(${240 + hueShift}, 20%, 10%) 100%)`,
      }}
    />
  );
};
