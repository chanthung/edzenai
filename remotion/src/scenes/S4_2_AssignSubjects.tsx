import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S4_2_AssignSubjects: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Teachers" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="4.2" title="Assign Subjects & Classes" />
          <Sequence from={15} durationInFrames={700}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 20 }}>Edit Teacher: Ms. Kavita Sharma</div>
              <div style={{ display: "flex", gap: 32 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>ASSIGNED CLASSES</div>
                  {["Class 5 - Section A", "Class 5 - Section B", "Class 6 - Section A"].map((cls, i) => (
                    <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", opacity: interpolate(frame - 15 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>✓</div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{cls}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>ASSIGNED SUBJECTS</div>
                  {["Mathematics", "Science"].map((sub, i) => (
                    <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", opacity: interpolate(frame - 30 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>✓</div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={140}><StepCaption step={1} text="Click the Edit (pencil) icon on a teacher's row" /></Sequence>
          <Sequence from={140} durationInFrames={180}><StepCaption step={2} text="Update name, status, reassign subjects and classes" /></Sequence>
          <Sequence from={320} durationInFrames={180}><StepCaption step={3} text='Click "Save Changes" to apply' /></Sequence>
          <Sequence from={500} durationInFrames={200}><StepCaption text="⚠️ Teachers can only see students in their assigned classes" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
