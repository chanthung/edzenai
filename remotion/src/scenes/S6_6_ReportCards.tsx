import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { MockCard } from "../components/MockCard";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_6_ReportCards: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Report Cards" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.6" title="Report Cards" />
          <Sequence from={10} durationInFrames={700}>
            <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
              {["Individual", "Class"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 0 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={30} durationInFrames={700}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "sans-serif" }}>Aarav Sharma</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif", marginTop: 4 }}>Class 5 - Section A | Roll No: 12</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "sans-serif", height: "fit-content" }}>🖨 Print</div>
              </div>
              <MockTable headers={["Subject", "PT /20", "NB /10", "SEE /60", "Total", "Grade"]} rows={[
                ["Mathematics", "18", "9", "52", "79", "B1"],
                ["Science", "20", "10", "58", "88", "A2"],
                ["English", "17", "8", "50", "75", "B1"],
                ["Hindi", "19", "9", "55", "83", "A2"],
              ]} delay={15} />
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                <MockCard title="Attendance" value="92%" color="#34d399" delay={40} />
                <MockCard title="Overall Grade" value="A2" color="#a5b4fc" delay={45} />
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Select Year, Class, and Student" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption text="View subject-wise marks, grades, and attendance summary" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption step={2} text='Click "Print" or "Print All" for bulk class report cards' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
