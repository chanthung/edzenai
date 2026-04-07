import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { MockCard } from "../components/MockCard";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const FPS = 30;

const CreateYearScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Academic Years" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="2.1" title="Create a New Academic Year" />

          {/* Existing years table */}
          <Sequence from={15} durationInFrames={200}>
            <MockTable
              headers={["Name", "Start Date", "End Date", "Status"]}
              rows={[
                ["2025-26", "Apr 1, 2025", "Mar 31, 2026", "🟢 Active"],
                ["2024-25", "Apr 1, 2024", "Mar 31, 2025", "⚪ Inactive"],
              ]}
              delay={0}
            />
          </Sequence>

          {/* New Year form */}
          <Sequence from={120} durationInFrames={350}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm
                title="Create Academic Year"
                fields={[
                  { label: "Name", value: "2026-27" },
                  { label: "Start Date", value: "April 1, 2026" },
                  { label: "End Date", value: "March 31, 2027" },
                  { label: "Active", value: "✓ ON" },
                ]}
                buttonText="Create Year"
                delay={0}
              />
            </div>
          </Sequence>

          {/* Captions */}
          <Sequence from={0} durationInFrames={50}>
            <StepCaption step={1} text='Navigate to "Academic Years" from the sidebar' />
          </Sequence>
          <Sequence from={50} durationInFrames={70}>
            <StepCaption step={2} text='Click "+ New Year" — fill in Name, Start/End dates' />
          </Sequence>
          <Sequence from={120} durationInFrames={90}>
            <StepCaption step={3} text="Toggle Active ON to make this the current year" />
          </Sequence>
          <Sequence from={210} durationInFrames={80}>
            <StepCaption text="⚠️ Only one year can be active at a time — activating a new one deactivates others" />
          </Sequence>
          <Sequence from={290} durationInFrames={80}>
            <StepCaption step={4} text='Click "Create Year" to save' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PromotionsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Academic Years" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="2.2" title="Student Promotions" />

          {/* Tab bar */}
          <Sequence from={10} durationInFrames={500}>
            <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
              {["Years", "Promotions"].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    padding: "10px 24px",
                    fontSize: 14,
                    fontWeight: i === 1 ? 600 : 400,
                    color: i === 1 ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                    borderBottom: i === 1 ? "2px solid #6366f1" : "2px solid transparent",
                    fontFamily: "sans-serif",
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </Sequence>

          {/* Source/Target year selectors */}
          <Sequence from={25} durationInFrames={500}>
            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Source Year", value: "2025-26" },
                { label: "Target Year", value: "2026-27" },
                { label: "Class", value: "Class 5" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    padding: "10px 16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    opacity: interpolate(frame - 25 - i * 8, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                >
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: "#fff", fontFamily: "sans-serif", fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Sequence>

          {/* Student promotion table */}
          <Sequence from={60} durationInFrames={400}>
            <MockTable
              headers={["Student", "Current Class", "Suggestion", "Action"]}
              rows={[
                ["Aarav Sharma", "Class 5-A", "🟢 Promote", "Promote ▾"],
                ["Priya Patel", "Class 5-A", "🟢 Promote", "Promote ▾"],
                ["Rahul Kumar", "Class 5-B", "🔴 Retain", "Retain ▾"],
                ["Sneha Gupta", "Class 5-A", "🟢 Promote", "Promote ▾"],
              ]}
              delay={0}
            />
          </Sequence>

          {/* Apply button */}
          <Sequence from={300} durationInFrames={120}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: 10,
                  padding: "12px 28px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: "sans-serif",
                  opacity: interpolate(frame - 300, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                Apply Promotions
              </div>
            </div>
          </Sequence>

          {/* Captions */}
          <Sequence from={0} durationInFrames={50}>
            <StepCaption step={1} text="Switch to the Promotions tab" />
          </Sequence>
          <Sequence from={50} durationInFrames={70}>
            <StepCaption step={2} text="Select Source Year, Target Year, and Class to promote" />
          </Sequence>
          <Sequence from={120} durationInFrames={90}>
            <StepCaption step={3} text="System shows auto-suggestions: Promote (passed) or Retain (failing grades)" />
          </Sequence>
          <Sequence from={210} durationInFrames={90}>
            <StepCaption step={4} text="Override any suggestion — choose Promote, Retain, or Exclude per student" />
          </Sequence>
          <Sequence from={300} durationInFrames={80}>
            <StepCaption step={5} text='Click "Apply Promotions" — students are enrolled in the target year' />
          </Sequence>
          <Sequence from={380} durationInFrames={60}>
            <StepCaption text="Path: Nursery → LKG → UKG → Class 1 → ... → Class 12" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ch2AcademicYears: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={2} title="Academic Years" subtitle="Manage academic periods and student promotions" />
      </Sequence>
      <Sequence from={FPS * 4} durationInFrames={FPS * 80}>
        <CreateYearScene />
      </Sequence>
      <Sequence from={FPS * 84} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Student Promotions →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 86} durationInFrames={FPS * 94}>
        <PromotionsScene />
      </Sequence>
    </AbsoluteFill>
  );
};
