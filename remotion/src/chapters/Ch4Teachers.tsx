import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const FPS = 30;

const AddTeacherScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Teachers" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="4.1" title="Add a Teacher" />
          <Sequence from={15} durationInFrames={100}>
            <MockTable
              headers={["Name", "Email", "Status", "Actions"]}
              rows={[
                ["Ms. Priya Menon", "priya@school.com", "🟢 Active", "✏️"],
                ["Mr. Arjun Rao", "arjun@school.com", "🟢 Active", "✏️"],
              ]}
              delay={0}
            />
          </Sequence>
          <Sequence from={90} durationInFrames={400}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm
                title="Add New Teacher"
                fields={[
                  { label: "Full Name", value: "Ms. Kavita Sharma" },
                  { label: "Email", value: "kavita@school.com" },
                  { label: "Password", value: "••••••••" },
                  { label: "Confirm Password", value: "••••••••" },
                ]}
                buttonText="Create Teacher"
                delay={0}
              />
            </div>
          </Sequence>
          {/* Subject checkboxes */}
          <Sequence from={250} durationInFrames={200}>
            <div
              style={{
                position: "absolute",
                top: 440,
                right: 60,
                width: 420,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 20,
                opacity: interpolate(frame - 250, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>
                ASSIGN SUBJECTS
              </div>
              {["Mathematics", "Science", "English", "Hindi"].map((sub, i) => {
                const checked = i < 2;
                return (
                  <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: checked ? "#6366f1" : "rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, color: "#fff",
                      }}
                    >
                      {checked ? "✓" : ""}
                    </div>
                    <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{sub}</span>
                  </div>
                );
              })}
            </div>
          </Sequence>

          <Sequence from={0} durationInFrames={50}>
            <StepCaption step={1} text='Navigate to "Teachers" and click "+ Add Teacher"' />
          </Sequence>
          <Sequence from={50} durationInFrames={80}>
            <StepCaption step={2} text="Fill in Name, Email, and initial Password" />
          </Sequence>
          <Sequence from={130} durationInFrames={80}>
            <StepCaption step={3} text="Optionally assign Subjects the teacher will handle" />
          </Sequence>
          <Sequence from={210} durationInFrames={80}>
            <StepCaption step={4} text="Assign Classes & Sections the teacher manages" />
          </Sequence>
          <Sequence from={290} durationInFrames={80}>
            <StepCaption step={5} text='Click "Create Teacher" — they can log in immediately!' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AssignScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Teachers" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="4.2" title="Assign Subjects & Classes" />
          <Sequence from={15} durationInFrames={400}>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 24,
              }}
            >
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 20 }}>
                Edit Teacher: Ms. Kavita Sharma
              </div>
              <div style={{ display: "flex", gap: 32 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>
                    ASSIGNED CLASSES & SECTIONS
                  </div>
                  {["Class 5 - Section A", "Class 5 - Section B", "Class 6 - Section A"].map((cls, i) => (
                    <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                      opacity: interpolate(frame - 15 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>✓</div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{cls}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 12 }}>
                    ASSIGNED SUBJECTS
                  </div>
                  {["Mathematics", "Science"].map((sub, i) => (
                    <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                      opacity: interpolate(frame - 30 - i * 6, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>✓</div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={60}>
            <StepCaption step={1} text="Click the Edit (pencil) icon on a teacher's row" />
          </Sequence>
          <Sequence from={60} durationInFrames={80}>
            <StepCaption step={2} text="Update name, status, and reassign subjects/classes" />
          </Sequence>
          <Sequence from={140} durationInFrames={80}>
            <StepCaption step={3} text='Click "Save Changes" to apply' />
          </Sequence>
          <Sequence from={220} durationInFrames={80}>
            <StepCaption text="⚠️ Teachers only see students in their assigned classes" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ch4Teachers: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={4} title="Teachers" subtitle="Add staff and assign subjects & classes" />
      </Sequence>
      <Sequence from={FPS * 4} durationInFrames={FPS * 80}>
        <AddTeacherScene />
      </Sequence>
      <Sequence from={FPS * 84} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Assign Subjects & Classes →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 86} durationInFrames={FPS * 94}>
        <AssignScene />
      </Sequence>
    </AbsoluteFill>
  );
};
