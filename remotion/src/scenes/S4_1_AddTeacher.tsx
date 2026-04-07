import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S4_1_AddTeacher: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Teachers" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="4.1" title="Add a Teacher" />
          <Sequence from={15} durationInFrames={200}>
            <MockTable headers={["Name", "Email", "Status"]} rows={[
              ["Ms. Priya Menon", "priya@school.com", "🟢 Active"],
              ["Mr. Arjun Rao", "arjun@school.com", "🟢 Active"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={90} durationInFrames={700}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm title="Add New Teacher" fields={[
                { label: "Full Name", value: "Ms. Kavita Sharma" },
                { label: "Email", value: "kavita@school.com" },
                { label: "Password", value: "••••••••" },
              ]} buttonText="Create Teacher" delay={0} />
            </div>
          </Sequence>
          <Sequence from={350} durationInFrames={400}>
            <div style={{ position: "absolute", top: 400, right: 60, width: 420, background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20, opacity: interpolate(frame - 350, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>ASSIGN SUBJECTS</div>
              {["Mathematics", "Science", "English", "Hindi"].map((sub, i) => (
                <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: i < 2 ? "#6366f1" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{i < 2 ? "✓" : ""}</div>
                  <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{sub}</span>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={120}><StepCaption step={1} text='Navigate to "Teachers" and click "+ Add Teacher"' /></Sequence>
          <Sequence from={120} durationInFrames={150}><StepCaption step={2} text="Fill in Name, Email, and initial Password" /></Sequence>
          <Sequence from={270} durationInFrames={150}><StepCaption step={3} text="Optionally assign Subjects and Classes" /></Sequence>
          <Sequence from={420} durationInFrames={200}><StepCaption step={4} text='Click "Create Teacher" — they can log in immediately!' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
