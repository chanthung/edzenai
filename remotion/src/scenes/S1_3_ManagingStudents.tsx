import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

export const S1_3_ManagingStudents: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.3" title="Managing Students" />
          <Sequence from={15} durationInFrames={800}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)" }}>🔍 Search students by name...</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)" }}>Class: All ▾</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)" }}>⬇ Export</div>
            </div>
          </Sequence>
          <Sequence from={30} durationInFrames={800}>
            <MockTable headers={["Name", "Class", "Section", "Roll", "Parent", "Actions"]} rows={[
              ["Aarav Sharma", "5", "A", "12", "Rajesh Sharma", "✏️ 🗑 💬 ₹"],
              ["Priya Patel", "5", "A", "13", "Meena Patel", "✏️ 🗑 💬 ₹"],
              ["Rahul Kumar", "5", "B", "1", "Suresh Kumar", "✏️ 🗑 💬 ₹"],
              ["Sneha Gupta", "6", "A", "5", "Anita Gupta", "✏️ 🗑 💬 ₹"],
              ["Vikram Singh", "6", "B", "3", "Ajay Singh", "✏️ 🗑 💬 ₹"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={250} durationInFrames={500}>
            <div style={{ marginTop: 24, display: "flex", gap: 24, flexWrap: "wrap", opacity: interpolate(frame - 250, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              {[{ icon: "✏️", label: "Edit" }, { icon: "🗑", label: "Delete" }, { icon: "💬", label: "WhatsApp" }, { icon: "₹", label: "Fees" }, { icon: "💳", label: "Payment" }].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "sans-serif" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={125}><StepCaption text="Search students by name, filter by class, and manage records" /></Sequence>
          <Sequence from={125} durationInFrames={125}><StepCaption text="Each row has quick actions — Edit, Delete, Share, Fees, Payments" /></Sequence>
          <Sequence from={250} durationInFrames={150}><StepCaption text="Use ₹ icon to assign fees, 💬 for WhatsApp parent link" /></Sequence>
          <Sequence from={400} durationInFrames={200}><StepCaption text="Export filtered student list to Excel with the Download button" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
