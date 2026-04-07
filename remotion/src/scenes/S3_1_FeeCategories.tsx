import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S3_1_FeeCategories: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.1" title="Step 1: Create Fee Categories" />
          <Sequence from={15} durationInFrames={300}>
            <MockTable headers={["Category", "Group", "Mandatory"]} rows={[
              ["Tuition Fee", "—", "✓ Yes"],
              ["Transport Fee", "—", "✗ No"],
              ["Shirt", "Uniforms", "✗ No"],
              ["Pants", "Uniforms", "✗ No"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={140} durationInFrames={600}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm title="Add Fee Category" fields={[
                { label: "Name", value: "Lab Fee" },
                { label: "Description", value: "Science lab charges" },
                { label: "Category Group", value: "Academic" },
                { label: "Mandatory", value: "✓ ON" },
              ]} buttonText="Create" delay={0} />
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={140}><StepCaption step={1} text='Navigate to "Fee Setup" from the sidebar' /></Sequence>
          <Sequence from={140} durationInFrames={200}><StepCaption step={2} text='Click "+ Add Category" — fill Name, Description, Group' /></Sequence>
          <Sequence from={340} durationInFrames={200}><StepCaption step={3} text="Toggle Mandatory ON if fee applies to all students" /></Sequence>
          <Sequence from={540} durationInFrames={200}><StepCaption text="💡 Use Category Groups to cluster related fees together" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
