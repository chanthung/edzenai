import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { ChapterTitle } from "../components/ChapterTitle";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { AnimatedPointer } from "../components/AnimatedPointer";
import { SectionTitle } from "../components/SectionTitle";

const FPS = 30;

// Section 1.1: Add Students Manually
const AddManuallyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.1" title="Add Students Manually" />
          
          {/* Page header mockup */}
          <Sequence from={20} durationInFrames={200}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif" }}>
                Manage all student records
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  borderRadius: 10,
                  padding: "10px 20px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "sans-serif",
                  opacity: interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                + Add Student
              </div>
            </div>
          </Sequence>

          {/* Pointer clicks Add Student button */}
          <Sequence from={40} durationInFrames={40}>
            <AnimatedPointer x={1580} y={120} clickAtFrame={18} />
          </Sequence>

          {/* Form appears */}
          <Sequence from={85} durationInFrames={350}>
            <div style={{ position: "absolute", top: 80, left: 300, right: 300 }}>
              <MockForm
                title="Add New Student"
                fields={[
                  { label: "Full Name", value: "Aarav Sharma" },
                  { label: "Class", value: "Class 5" },
                  { label: "Section", value: "A" },
                  { label: "Roll Number", value: "12" },
                  { label: "Parent Name", value: "Rajesh Sharma" },
                  { label: "Parent Phone", value: "+91 98765 43210" },
                ]}
                buttonText="Add Student"
              />
            </div>
          </Sequence>

          {/* Step captions */}
          <Sequence from={0} durationInFrames={40}>
            <StepCaption step={1} text='Navigate to "Students" from the sidebar menu' />
          </Sequence>
          <Sequence from={40} durationInFrames={45}>
            <StepCaption step={2} text='Click the "+ Add Student" button in the top-right corner' />
          </Sequence>
          <Sequence from={85} durationInFrames={120}>
            <StepCaption step={3} text="Fill in student details — Name, Class, Section, Roll Number, Parent info" />
          </Sequence>
          <Sequence from={205} durationInFrames={80}>
            <StepCaption step={4} text="Select the Academic Year for enrollment (defaults to active year)" />
          </Sequence>
          <Sequence from={285} durationInFrames={80}>
            <StepCaption step={5} text='Click "Add Student" to save — fees are auto-assigned!' />
          </Sequence>
          <Sequence from={365} durationInFrames={60}>
            <StepCaption text="💡 Tip: Click Share button to send parent access link via WhatsApp" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Section 1.2: Excel Import
const ExcelImportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.2" title="Import Students via Excel (AI-Powered)" />

          {/* Upload area */}
          <Sequence from={20} durationInFrames={150}>
            <div
              style={{
                marginTop: 10,
                border: "2px dashed rgba(99,102,241,0.4)",
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
                opacity: interpolate(frame - 20, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, fontFamily: "sans-serif" }}>
                Drop your Excel (.xlsx) or CSV file here
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "sans-serif", marginTop: 8 }}>
                Supported formats: .xlsx, .csv, .tsv
              </div>
            </div>
          </Sequence>

          {/* AI mapping preview */}
          <Sequence from={170} durationInFrames={250}>
            <div style={{ marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  opacity: interpolate(frame - 170, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    borderRadius: 8,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    fontFamily: "sans-serif",
                  }}
                >
                  AI MAPPED
                </div>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "sans-serif" }}>
                  5 columns auto-detected
                </span>
              </div>
              <MockTable
                headers={["Name", "Class", "Section", "Roll No", "Parent Phone"]}
                rows={[
                  ["Aarav Sharma", "5", "A", "12", "+91 98765 43210"],
                  ["Priya Patel", "5", "A", "13", "+91 87654 32100"],
                  ["Rahul Kumar", "5", "B", "1", "+91 76543 21000"],
                  ["Sneha Gupta", "6", "A", "5", "+91 65432 10000"],
                ]}
                delay={15}
              />
            </div>
          </Sequence>

          {/* Confirm button */}
          <Sequence from={350} durationInFrames={80}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  borderRadius: 10,
                  padding: "12px 28px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  fontFamily: "sans-serif",
                  opacity: interpolate(frame - 350, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                ✓ Confirm Import
              </div>
            </div>
          </Sequence>

          {/* Captions */}
          <Sequence from={0} durationInFrames={40}>
            <StepCaption step={1} text='Click the "Import Excel" button on the Students page' />
          </Sequence>
          <Sequence from={40} durationInFrames={60}>
            <StepCaption step={2} text="Select Academic Year and upload your Excel or CSV file" />
          </Sequence>
          <Sequence from={100} durationInFrames={70}>
            <StepCaption step={3} text="The AI engine analyzes your file and maps columns automatically" />
          </Sequence>
          <Sequence from={170} durationInFrames={90}>
            <StepCaption step={4} text="Review the AI-mapped fields — Name, Class, Roll Number, Phone, etc." />
          </Sequence>
          <Sequence from={260} durationInFrames={90}>
            <StepCaption step={5} text="Handle any duplicate warnings for students with same name in same class" />
          </Sequence>
          <Sequence from={350} durationInFrames={80}>
            <StepCaption step={6} text='Click "Confirm Import" — enrollments and fees are auto-assigned' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Section 1.3: Managing Students
const ManagingStudentsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Students" />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="1.3" title="Managing Students" />

          {/* Search and filter bar */}
          <Sequence from={15} durationInFrames={400}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 14,
                  fontFamily: "sans-serif",
                  border: "1px solid rgba(255,255,255,0.1)",
                  opacity: interpolate(frame - 15, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                🔍 Search students by name...
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  fontFamily: "sans-serif",
                  border: "1px solid rgba(255,255,255,0.1)",
                  opacity: interpolate(frame - 20, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                Class: All ▾
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  fontFamily: "sans-serif",
                  border: "1px solid rgba(255,255,255,0.1)",
                  opacity: interpolate(frame - 25, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                ⬇ Export
              </div>
            </div>
          </Sequence>

          {/* Student table */}
          <Sequence from={35} durationInFrames={350}>
            <MockTable
              headers={["Name", "Class", "Section", "Roll", "Parent", "Actions"]}
              rows={[
                ["Aarav Sharma", "5", "A", "12", "Rajesh Sharma", "✏️  🗑  💬  ₹"],
                ["Priya Patel", "5", "A", "13", "Meena Patel", "✏️  🗑  💬  ₹"],
                ["Rahul Kumar", "5", "B", "1", "Suresh Kumar", "✏️  🗑  💬  ₹"],
                ["Sneha Gupta", "6", "A", "5", "Anita Gupta", "✏️  🗑  💬  ₹"],
                ["Vikram Singh", "6", "B", "3", "Ajay Singh", "✏️  🗑  💬  ₹"],
              ]}
              delay={0}
            />
          </Sequence>

          {/* Action icons legend */}
          <Sequence from={200} durationInFrames={200}>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                opacity: interpolate(frame - 200, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {[
                { icon: "✏️", label: "Edit details" },
                { icon: "🗑", label: "Delete" },
                { icon: "💬", label: "Share WhatsApp link" },
                { icon: "₹", label: "Manage fees" },
                { icon: "💳", label: "Record payment" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "sans-serif" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </Sequence>

          {/* Captions */}
          <Sequence from={0} durationInFrames={60}>
            <StepCaption text="Search students by name, filter by class, and manage records" />
          </Sequence>
          <Sequence from={60} durationInFrames={70}>
            <StepCaption text="Each student row has quick actions — Edit, Delete, Share, Fees, Payments" />
          </Sequence>
          <Sequence from={130} durationInFrames={70}>
            <StepCaption text="Click the pencil icon to edit student details anytime" />
          </Sequence>
          <Sequence from={200} durationInFrames={70}>
            <StepCaption text="Click Share to send parent access link via WhatsApp" />
          </Sequence>
          <Sequence from={270} durationInFrames={80}>
            <StepCaption text="Use the ₹ icon to assign/remove fee structures for a student" />
          </Sequence>
          <Sequence from={350} durationInFrames={60}>
            <StepCaption text="Export filtered student list to Excel with the Download button" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main Chapter 1
export const Ch1Students: React.FC = () => {
  const FPS = 30;
  return (
    <AbsoluteFill>
      <Background />

      {/* Chapter title card */}
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={1} title="Students" subtitle="Add, import, and manage student records" />
      </Sequence>

      {/* 1.1 Add Manually */}
      <Sequence from={FPS * 4} durationInFrames={FPS * 70}>
        <AddManuallyScene />
      </Sequence>

      {/* Transition card */}
      <Sequence from={FPS * 74} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: AI-Powered Excel Import →</div>
        </AbsoluteFill>
      </Sequence>

      {/* 1.2 Excel Import */}
      <Sequence from={FPS * 76} durationInFrames={FPS * 70}>
        <ExcelImportScene />
      </Sequence>

      {/* Transition card */}
      <Sequence from={FPS * 146} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Managing Students →</div>
        </AbsoluteFill>
      </Sequence>

      {/* 1.3 Managing Students */}
      <Sequence from={FPS * 148} durationInFrames={FPS * 62}>
        <ManagingStudentsScene />
      </Sequence>
    </AbsoluteFill>
  );
};
