import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_4_MarksEntry: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Marks Entry" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.4" title="Marks Entry" />
          <Sequence from={10} durationInFrames={800}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {["Year: 2025-26", "Class: 5", "Section: A", "Assessment: Mid-Term", "Subject: Maths"].map((f, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 10 - i * 4, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{f}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={40} durationInFrames={760}>
            <MockTable headers={["Student", "PT /20", "NB /10", "SEE /60", "Total", "Grade"]} rows={[
              ["Aarav Sharma", "18", "9", "52", "79", "B1"],
              ["Priya Patel", "20", "10", "58", "88", "A2"],
              ["Rahul Kumar", "14", "7", "42", "63", "C1"],
              ["Sneha Gupta", "19", "9", "55", "83", "A2"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={450} durationInFrames={300}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "sans-serif", opacity: interpolate(frame - 450, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Save Marks</div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Select Year, Class, Section, Assessment, and Subject" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Enter marks per component — total and grade auto-calculated" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption step={3} text='Click "Save Marks" to save all entries' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
