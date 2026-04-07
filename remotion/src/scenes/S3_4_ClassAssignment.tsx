import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S3_4_ClassAssignment: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.4" title="Class Assignment & Auto-Assign" />
          <Sequence from={15} durationInFrames={700}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 20 }}>Assign to Classes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"].map((cls, i) => {
                  const checked = i < 3;
                  return (
                    <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, background: checked ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 14px", border: checked ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 15 - i * 5, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: checked ? "#6366f1" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{checked ? "✓" : ""}</div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{cls}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                {[{ label: "Auto-assign", on: true }, { label: "New Admissions Only", on: false }].map((toggle, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: toggle.on ? "#6366f1" : "rgba(255,255,255,0.15)", position: "relative" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: toggle.on ? 23 : 3 }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "sans-serif" }}>{toggle.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Check the classes this fee applies to" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Toggle Auto-assign ON to apply fees to all students automatically" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text='"New Admissions Only" restricts fee to new students only' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
