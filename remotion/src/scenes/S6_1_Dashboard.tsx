import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockCard } from "../components/MockCard";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_1_Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Dashboard" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.1" title="Progress Dashboard" />
          <Sequence from={10} durationInFrames={700}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {["Year: 2025-26", "Class: 5", "Status: All"].map((f, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 10 - i * 5, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{f}</div>
              ))}
            </div>
          </Sequence>
          <Sequence from={20} durationInFrames={700}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <MockCard title="Total Students" value="45" color="#a5b4fc" delay={0} />
              <MockCard title="Class Average" value="78%" color="#34d399" delay={5} />
              <MockCard title="Improving" value="12" color="#fbbf24" delay={10} />
              <MockCard title="At Risk" value="3" color="#f87171" delay={15} />
            </div>
          </Sequence>
          <Sequence from={50} durationInFrames={650}>
            <div style={{ display: "flex", gap: 16 }}>
              {["Class Distribution", "Subject Comparison"].map((chart, i) => (
                <div key={chart} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 20, height: 220, display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: interpolate(frame - 60 - i * 10, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "sans-serif" }}>{chart}</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140 }}>
                    {[65, 80, 45, 90, 70, 55].map((h, j) => (
                      <div key={j} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(180deg, hsl(${240 + j * 15}, 70%, 60%), hsl(${240 + j * 15}, 60%, 40%))`, borderRadius: 6, opacity: interpolate(frame - 80 - j * 4, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={200}><StepCaption text="Dashboard gives a bird's-eye view with filters and charts" /></Sequence>
          <Sequence from={200} durationInFrames={200}><StepCaption text="Cards show Total Students, Class Average, Improving, At Risk" /></Sequence>
          <Sequence from={400} durationInFrames={200}><StepCaption text="Use AI Insights for AI-generated class analysis" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
