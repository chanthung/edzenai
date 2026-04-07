import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S3_2_FeeStructures: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.2" title="Step 2: Add Fee Structures" />
          <Sequence from={15} durationInFrames={200}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 14, fontFamily: "sans-serif", border: "1px solid rgba(99,102,241,0.5)" }}>Academic Year: 2025-26 ▾</div>
            </div>
          </Sequence>
          <Sequence from={60} durationInFrames={600}>
            <MockForm title="Add Fee Structure" fields={[
              { label: "Fee Category", value: "Tuition Fee" },
              { label: "Total Amount", value: "₹ 24,000" },
            ]} buttonText="Create" delay={0} />
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Select the Academic Year from the dropdown" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text='Click "+ Add Fee" — select Category and enter Total Amount' /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text="Each category can only have one fee structure per year" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
