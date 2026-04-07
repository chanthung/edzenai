import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_5_Attendance: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Attendance" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.5" title="Attendance" />
          <Sequence from={10} durationInFrames={700}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>← Apr 7, 2026 →</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif" }}>Class: 5</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif" }}>Section: A</div>
              <div style={{ marginLeft: "auto", background: "rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 14px", color: "#34d399", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif" }}>Mark All Present</div>
            </div>
          </Sequence>
          <Sequence from={30} durationInFrames={670}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              {[
                { name: "Aarav Sharma", status: "present" },
                { name: "Priya Patel", status: "present" },
                { name: "Rahul Kumar", status: "absent" },
                { name: "Sneha Gupta", status: "late" },
                { name: "Vikram Singh", status: "present" },
              ].map((student, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none", opacity: interpolate(frame - 30 - i * 5, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                  <div style={{ flex: 1, color: "#fff", fontSize: 15, fontFamily: "sans-serif" }}>{student.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { label: "✓", key: "present", color: "#22c55e" },
                      { label: "✗", key: "absent", color: "#ef4444" },
                      { label: "⏰", key: "late", color: "#eab308" },
                    ].map((btn) => (
                      <div key={btn.key} style={{ width: 36, height: 36, borderRadius: 8, background: student.status === btn.key ? btn.color + "33" : "rgba(255,255,255,0.06)", border: student.status === btn.key ? `2px solid ${btn.color}` : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: student.status === btn.key ? btn.color : "rgba(255,255,255,0.4)" }}>{btn.label}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text="Select Date, Class, and Section" /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Mark each student as Present ✓, Absent ✗, or Late ⏰" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text='"Mark All Present" then adjust individual entries' /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
