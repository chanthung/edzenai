import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S5_3_Templates: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Settings" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="5.4" title="Assessment Templates" />
          <Sequence from={10} durationInFrames={100}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["School", "Security", "Templates"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 2 ? 600 : 400, color: i === 2 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 2 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={20} durationInFrames={800}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <MockForm title="Create Template" fields={[
                  { label: "Template Name", value: "CBSE Standard" },
                  { label: "Grading Type", value: "Marks-based" },
                ]} buttonText="Create Template" delay={0} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20, opacity: interpolate(frame - 80, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>COMPONENTS</div>
                  <MockTable headers={["Component", "Max Marks"]} rows={[
                    ["Periodic Test", "20"],
                    ["Notebook Work", "10"],
                    ["Subject Enrichment", "10"],
                    ["SEE", "60"],
                  ]} delay={20} />
                </div>
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text='Switch to Templates tab → Click "+ New Template"' /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Define Name, Grading Type, add Components with max marks" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption step={3} text="Add Grade Mappings and assign template to classes" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
