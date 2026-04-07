import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S2_1_CreateYear: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Academic Years" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="2.1" title="Create a New Academic Year" />
          <Sequence from={15} durationInFrames={300}>
            <MockTable headers={["Name", "Start Date", "End Date", "Status"]} rows={[
              ["2025-26", "Apr 1, 2025", "Mar 31, 2026", "🟢 Active"],
              ["2024-25", "Apr 1, 2024", "Mar 31, 2025", "⚪ Inactive"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={120} durationInFrames={700}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm title="Create Academic Year" fields={[
                { label: "Name", value: "2026-27" },
                { label: "Start Date", value: "April 1, 2026" },
                { label: "End Date", value: "March 31, 2027" },
                { label: "Active", value: "✓ ON" },
              ]} buttonText="Create Year" delay={0} />
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={120}><StepCaption step={1} text='Navigate to "Academic Years" from the sidebar' /></Sequence>
          <Sequence from={120} durationInFrames={180}><StepCaption step={2} text='Click "+ New Year" — fill in Name, Start/End dates' /></Sequence>
          <Sequence from={300} durationInFrames={200}><StepCaption step={3} text="Toggle Active ON — only one year can be active at a time" /></Sequence>
          <Sequence from={500} durationInFrames={200}><StepCaption step={4} text='Click "Create Year" to save' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
