import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";
import { AnimatedPointer } from "../components/AnimatedPointer";

export const S1_1_AddManually: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.1" title="Add Students Manually" />
          <Sequence from={20} durationInFrames={200}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif" }}>Manage all student records</div>
              <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "sans-serif", opacity: interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>+ Add Student</div>
            </div>
          </Sequence>
          <Sequence from={40} durationInFrames={40}>
            <AnimatedPointer x={1580} y={120} clickAtFrame={18} />
          </Sequence>
          <Sequence from={85} durationInFrames={800}>
            <div style={{ position: "absolute", top: 80, left: 300, right: 300 }}>
              <MockForm title="Add New Student" fields={[
                { label: "Full Name", value: "Aarav Sharma" },
                { label: "Class", value: "Class 5" },
                { label: "Section", value: "A" },
                { label: "Roll Number", value: "12" },
                { label: "Parent Name", value: "Rajesh Sharma" },
                { label: "Parent Phone", value: "+91 98765 43210" },
              ]} buttonText="Add Student" />
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={40}><StepCaption step={1} text='Navigate to "Students" from the sidebar menu' /></Sequence>
          <Sequence from={40} durationInFrames={45}><StepCaption step={2} text='Click the "+ Add Student" button in the top-right corner' /></Sequence>
          <Sequence from={85} durationInFrames={180}><StepCaption step={3} text="Fill in student details — Name, Class, Section, Roll Number, Parent info" /></Sequence>
          <Sequence from={265} durationInFrames={180}><StepCaption step={4} text="Select Academic Year for enrollment, then click Add Student" /></Sequence>
          <Sequence from={445} durationInFrames={200}><StepCaption text="💡 Tip: Click Share to send parent access link via WhatsApp" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
