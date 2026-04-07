import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S1_2_ExcelImport: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.2" title="Import Students via Excel (AI-Powered)" />
          <Sequence from={15} durationInFrames={200}>
            <div style={{ border: "2px dashed rgba(99,102,241,0.4)", borderRadius: 16, padding: 40, textAlign: "center", opacity: interpolate(frame - 15, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "sans-serif" }}>Drop your Excel (.xlsx) or CSV file here</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "sans-serif", marginTop: 8 }}>Supported: .xlsx, .csv, .tsv</div>
            </div>
          </Sequence>
          <Sequence from={200} durationInFrames={600}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, opacity: interpolate(frame - 200, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "sans-serif" }}>AI MAPPED</div>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "sans-serif" }}>5 columns auto-detected</span>
              </div>
              <MockTable headers={["Name", "Class", "Section", "Roll No", "Parent Phone"]} rows={[
                ["Aarav Sharma", "5", "A", "12", "+91 98765 43210"],
                ["Priya Patel", "5", "A", "13", "+91 87654 32100"],
                ["Rahul Kumar", "5", "B", "1", "+91 76543 21000"],
                ["Sneha Gupta", "6", "A", "5", "+91 65432 10000"],
              ]} delay={15} />
            </div>
          </Sequence>
          <Sequence from={500} durationInFrames={200}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "sans-serif", opacity: interpolate(frame - 500, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>✓ Confirm Import</div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={100}><StepCaption step={1} text='Click "Import Excel" button on the Students page' /></Sequence>
          <Sequence from={100} durationInFrames={100}><StepCaption step={2} text="Select Academic Year and upload your Excel or CSV file" /></Sequence>
          <Sequence from={200} durationInFrames={150}><StepCaption step={3} text="AI engine auto-maps columns — Name, Class, Roll Number, Phone, etc." /></Sequence>
          <Sequence from={350} durationInFrames={150}><StepCaption step={4} text="Review mapped fields and handle any duplicate warnings" /></Sequence>
          <Sequence from={500} durationInFrames={200}><StepCaption step={5} text='Click "Confirm Import" — enrollments and fees auto-assigned!' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
