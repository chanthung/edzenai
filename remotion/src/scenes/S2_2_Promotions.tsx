import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S2_2_Promotions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Academic Years" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="2.2" title="Student Promotions" />
          <Sequence from={10} durationInFrames={900}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["Years", "Promotions"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 1 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={25} durationInFrames={900}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              {[{ label: "Source Year", value: "2025-26" }, { label: "Target Year", value: "2026-27" }, { label: "Class", value: "Class 5" }].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 25 - i * 8, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={60} durationInFrames={800}>
            <MockTable headers={["Student", "Current Class", "Suggestion", "Action"]} rows={[
              ["Aarav Sharma", "Class 5-A", "🟢 Promote", "Promote ▾"],
              ["Priya Patel", "Class 5-A", "🟢 Promote", "Promote ▾"],
              ["Rahul Kumar", "Class 5-B", "🔴 Retain", "Retain ▾"],
              ["Sneha Gupta", "Class 5-A", "🟢 Promote", "Promote ▾"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={500} durationInFrames={300}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "sans-serif", opacity: interpolate(frame - 500, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Apply Promotions</div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={120}><StepCaption step={1} text="Switch to the Promotions tab" /></Sequence>
          <Sequence from={120} durationInFrames={150}><StepCaption step={2} text="Select Source Year, Target Year, and Class to promote" /></Sequence>
          <Sequence from={270} durationInFrames={150}><StepCaption step={3} text="System auto-suggests: Promote (passed) or Retain (failing)" /></Sequence>
          <Sequence from={420} durationInFrames={150}><StepCaption step={4} text="Override any suggestion — Promote, Retain, or Exclude per student" /></Sequence>
          <Sequence from={570} durationInFrames={200}><StepCaption step={5} text='Click "Apply Promotions" — students enrolled in target year' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
