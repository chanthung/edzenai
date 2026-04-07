import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const FPS = 30;

const FeeCategoriesScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.1" title="Step 1: Create Fee Categories" />
          <Sequence from={15} durationInFrames={150}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif", marginBottom: 16 }}>
              Categories define the types of fees (e.g., Tuition, Transport, Uniform)
            </div>
            <MockTable
              headers={["Category", "Group", "Mandatory"]}
              rows={[
                ["Tuition Fee", "—", "✓ Yes"],
                ["Transport Fee", "—", "✗ No"],
                ["Shirt", "Uniforms", "✗ No"],
                ["Pants", "Uniforms", "✗ No"],
              ]}
              delay={0}
            />
          </Sequence>

          <Sequence from={140} durationInFrames={300}>
            <div style={{ position: "absolute", top: 80, right: 60 }}>
              <MockForm
                title="Add Fee Category"
                fields={[
                  { label: "Name", value: "Lab Fee" },
                  { label: "Description", value: "Science lab charges" },
                  { label: "Category Group", value: "Academic" },
                  { label: "Mandatory", value: "✓ ON" },
                ]}
                buttonText="Create"
                delay={0}
              />
            </div>
          </Sequence>

          <Sequence from={0} durationInFrames={60}>
            <StepCaption step={1} text='Navigate to "Fee Setup" from the sidebar' />
          </Sequence>
          <Sequence from={60} durationInFrames={80}>
            <StepCaption step={2} text='Click "+ Add Category" and fill in Name, Description, Group' />
          </Sequence>
          <Sequence from={140} durationInFrames={100}>
            <StepCaption step={3} text="Toggle Mandatory ON if this fee applies to all students" />
          </Sequence>
          <Sequence from={240} durationInFrames={80}>
            <StepCaption text="💡 Use Category Groups to cluster related fees (e.g., all uniforms together)" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeeStructuresScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.2" title="Step 2: Add Fee Structures" />
          <Sequence from={15} durationInFrames={100}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "sans-serif",
                  border: "1px solid rgba(99,102,241,0.5)",
                }}
              >
                Academic Year: 2025-26 ▾
              </div>
            </div>
          </Sequence>
          <Sequence from={60} durationInFrames={300}>
            <MockForm
              title="Add Fee Structure"
              fields={[
                { label: "Fee Category", value: "Tuition Fee" },
                { label: "Total Amount", value: "₹ 24,000" },
              ]}
              buttonText="Create"
              delay={0}
            />
          </Sequence>
          <Sequence from={0} durationInFrames={60}>
            <StepCaption step={1} text="Select the Academic Year from the dropdown" />
          </Sequence>
          <Sequence from={60} durationInFrames={80}>
            <StepCaption step={2} text='Click "+ Add Fee" — select Category and enter Total Amount' />
          </Sequence>
          <Sequence from={140} durationInFrames={80}>
            <StepCaption text="Each category can only have one fee structure per academic year" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const InstallmentsScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.3" title="Step 3: Add Installments" />
          <Sequence from={15} durationInFrames={400}>
            <div>
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "sans-serif" }}>Tuition Fee</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif" }}>Total: ₹24,000</div>
                  </div>
                  <div style={{ color: "#a5b4fc", fontSize: 13, fontFamily: "sans-serif" }}>▾ Expand</div>
                </div>
                <MockTable
                  headers={["Installment", "Amount", "Due Date"]}
                  rows={[
                    ["1st Quarter", "₹6,000", "Apr 15, 2025"],
                    ["2nd Quarter", "₹6,000", "Jul 15, 2025"],
                    ["3rd Quarter", "₹6,000", "Oct 15, 2025"],
                    ["4th Quarter", "₹6,000", "Jan 15, 2026"],
                  ]}
                  delay={10}
                />
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={70}>
            <StepCaption step={1} text="Expand a fee structure by clicking the chevron" />
          </Sequence>
          <Sequence from={70} durationInFrames={80}>
            <StepCaption step={2} text='Click "+ Add Installment" — enter Name, Amount, and Due Date' />
          </Sequence>
          <Sequence from={150} durationInFrames={80}>
            <StepCaption text="💡 Installment amounts should add up to the total fee structure amount" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ClassAssignmentScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Fee Setup" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="3.4" title="Class Assignment & Auto-Assign" />
          <Sequence from={15} durationInFrames={350}>
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: 24,
              }}
            >
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "sans-serif", marginBottom: 20 }}>
                Assign to Classes
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"].map((cls, i) => {
                  const checked = i < 3;
                  return (
                    <div
                      key={cls}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: checked ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        padding: "8px 14px",
                        border: checked ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        opacity: interpolate(frame - 15 - i * 5, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: checked ? "#6366f1" : "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "#fff",
                        }}
                      >
                        {checked ? "✓" : ""}
                      </div>
                      <span style={{ color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>{cls}</span>
                    </div>
                  );
                })}
              </div>
              {/* Toggle switches */}
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { label: "Auto-assign", on: true },
                  { label: "New Admissions Only", on: false },
                ].map((toggle, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: toggle.on ? "#6366f1" : "rgba(255,255,255,0.15)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: toggle.on ? 23 : 3,
                        }}
                      />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "sans-serif" }}>{toggle.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={80}>
            <StepCaption step={1} text="Check the classes this fee applies to" />
          </Sequence>
          <Sequence from={80} durationInFrames={80}>
            <StepCaption step={2} text="Toggle Auto-assign ON to automatically apply fees to all students in those classes" />
          </Sequence>
          <Sequence from={160} durationInFrames={80}>
            <StepCaption text='Toggle "New Admissions Only" if the fee is only for new students' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ch3FeeSetup: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={3} title="Fee Setup" subtitle="Categories, structures, installments & class assignment" />
      </Sequence>
      <Sequence from={FPS * 4} durationInFrames={FPS * 55}>
        <FeeCategoriesScene />
      </Sequence>
      <Sequence from={FPS * 59} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Fee Structures →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 61} durationInFrames={FPS * 40}>
        <FeeStructuresScene />
      </Sequence>
      <Sequence from={FPS * 101} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Installments →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 103} durationInFrames={FPS * 45}>
        <InstallmentsScene />
      </Sequence>
      <Sequence from={FPS * 148} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Class Assignment →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 150} durationInFrames={FPS * 60}>
        <ClassAssignmentScene />
      </Sequence>
    </AbsoluteFill>
  );
};
