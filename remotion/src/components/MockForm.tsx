import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface FormField {
  label: string;
  value: string;
  type?: "text" | "select" | "toggle";
}

interface MockFormProps {
  title: string;
  fields: FormField[];
  buttonText?: string;
  delay?: number;
}

export const MockForm: React.FC<MockFormProps> = ({ title, fields, buttonText = "Save", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const formScale = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 120 } });
  const formOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: 28,
        maxWidth: 480,
        transform: `scale(${formScale})`,
        opacity: formOpacity,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "sans-serif", marginBottom: 24 }}>{title}</div>
      {fields.map((field, i) => {
        const fieldDelay = delay + 8 + i * 5;
        const fieldOpacity = interpolate(frame, [fieldDelay, fieldDelay + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Typing animation for the value
        const typingStart = fieldDelay + 8;
        const charsVisible = Math.max(0, Math.floor((frame - typingStart) * 0.8));
        const displayValue = field.value.substring(0, Math.min(charsVisible, field.value.length));

        return (
          <div key={i} style={{ marginBottom: 16, opacity: fieldOpacity }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                fontFamily: "sans-serif",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {field.label}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 14px",
                color: displayValue ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 15,
                fontFamily: "sans-serif",
                border: "1px solid rgba(255,255,255,0.1)",
                minHeight: 20,
              }}
            >
              {displayValue || field.label}
              {charsVisible > 0 && charsVisible < field.value.length && (
                <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: "#6366f1" }}>|</span>
              )}
            </div>
          </div>
        );
      })}
      {/* Submit button */}
      {(() => {
        const btnDelay = delay + 8 + fields.length * 5 + 20;
        const btnOpacity = interpolate(frame, [btnDelay, btnDelay + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            style={{
              marginTop: 20,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 10,
              padding: "12px 24px",
              textAlign: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "sans-serif",
              opacity: btnOpacity,
            }}
          >
            {buttonText}
          </div>
        );
      })()}
    </div>
  );
};
