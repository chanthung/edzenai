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
const progressItems = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.1" title="Progress Dashboard" />
          {/* Filter bar */}
          <Sequence from={10} durationInFrames={400}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {["Year: 2025-26", "Class: 5", "Status: All"].map((filter, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 10 - i * 5, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{filter}</div>
              ))}
            </div>
          </Sequence>
          {/* Summary cards */}
          <Sequence from={20} durationInFrames={400}>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
              <MockCard title="Total Students" value="45" color="#a5b4fc" delay={0} />
              <MockCard title="Class Average" value="78%" color="#34d399" delay={5} />
              <MockCard title="Improving" value="12" color="#fbbf24" delay={10} />
              <MockCard title="At Risk" value="3" color="#f87171" delay={15} />
            </div>
          </Sequence>
          {/* Charts placeholder */}
          <Sequence from={50} durationInFrames={350}>
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
          <Sequence from={0} durationInFrames={60}>
            <StepCaption text="The Dashboard gives a bird's-eye view with filters and interactive charts" />
          </Sequence>
          <Sequence from={60} durationInFrames={70}>
            <StepCaption text="Summary cards show Total Students, Class Average, Improving, and At Risk" />
          </Sequence>
          <Sequence from={130} durationInFrames={70}>
            <StepCaption text="Use AI Insights button for AI-generated class analysis" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SubjectsScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.2" title="Subjects" />
          <Sequence from={15} durationInFrames={300}>
            <MockTable
              headers={["Subject", "Code", "Type", "Classes"]}
              rows={[
                ["Mathematics", "MATH", "Scholastic", "1, 2, 3, 4, 5"],
                ["Science", "SCI", "Scholastic", "3, 4, 5"],
                ["English", "ENG", "Scholastic", "1, 2, 3, 4, 5"],
                ["Hindi", "HIN", "Scholastic", "1, 2, 3, 4, 5"],
                ["Art & Craft", "ART", "Co-Scholastic", "1, 2, 3"],
              ]}
              delay={0}
            />
          </Sequence>
          <Sequence from={0} durationInFrames={70}>
            <StepCaption step={1} text='Go to Student Progress → Subjects → Click "+ Add Subject"' />
          </Sequence>
          <Sequence from={70} durationInFrames={80}>
            <StepCaption step={2} text="Enter Name, Code, Type (Scholastic/Co-Scholastic), and assign to classes" />
          </Sequence>
          <Sequence from={150} durationInFrames={80}>
            <StepCaption text="Subjects must be added before creating assessments or entering marks" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AssessmentsScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.3" title="Assessments" />
          <Sequence from={15} durationInFrames={400}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <MockForm
                  title="Add Assessment"
                  fields={[
                    { label: "Name", value: "Mid-Term Exam" },
                    { label: "Type", value: "Mid Term" },
                    { label: "Date", value: "Sep 15, 2025" },
                    { label: "Domain (NEP)", value: "Cognitive" },
                    { label: "Category", value: "Summative" },
                  ]}
                  buttonText="Create Assessment"
                  delay={0}
                />
              </div>
              <div style={{ flex: 1 }}>
                <MockTable
                  headers={["Assessment", "Type", "Class", "Date"]}
                  rows={[
                    ["Unit Test 1", "Unit Test", "All", "Jul 20"],
                    ["Mid-Term", "Mid Term", "All", "Sep 15"],
                    ["Quiz 1", "Quiz", "Class 5", "Aug 5"],
                  ]}
                  delay={30}
                />
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={70}>
            <StepCaption step={1} text='Navigate to Assessments → Click "+ Add Assessment"' />
          </Sequence>
          <Sequence from={70} durationInFrames={80}>
            <StepCaption step={2} text="Fill Name, Type, Date, NEP Domain (Cognitive/Affective/Psychomotor), Category" />
          </Sequence>
          <Sequence from={150} durationInFrames={80}>
            <StepCaption text="Leave Class empty for school-wide exams, or specify a class for class-specific tests" />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const MarksEntryScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.4" title="Marks Entry" />
          {/* Filter dropdowns */}
          <Sequence from={10} durationInFrames={500}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {["Year: 2025-26", "Class: 5", "Section: A", "Assessment: Mid-Term", "Subject: Mathematics"].map((f, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif", border: "1px solid rgba(255,255,255,0.1)", opacity: interpolate(frame - 10 - i * 4, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{f}</div>
              ))}
            </div>
          </Sequence>
          {/* Marks table */}
          <Sequence from={40} durationInFrames={400}>
            <MockTable
              headers={["Student", "Periodic Test /20", "Notebook /10", "SEE /60", "Total /100", "Grade"]}
              rows={[
                ["Aarav Sharma", "18", "9", "52", "79", "B1"],
                ["Priya Patel", "20", "10", "58", "88", "A2"],
                ["Rahul Kumar", "14", "7", "42", "63", "C1"],
                ["Sneha Gupta", "19", "9", "55", "83", "A2"],
              ]}
              delay={0}
            />
          </Sequence>
          {/* Save button */}
          <Sequence from={250} durationInFrames={150}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 600, fontSize: 15, fontFamily: "sans-serif", opacity: interpolate(frame - 250, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                Save Marks
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={60}>
            <StepCaption step={1} text="Select Year, Class, Section, Assessment, and Subject" />
          </Sequence>
          <Sequence from={60} durationInFrames={80}>
            <StepCaption step={2} text="Enter marks for each student — component-wise if template is assigned" />
          </Sequence>
          <Sequence from={140} durationInFrames={80}>
            <StepCaption text="Total and Grade are calculated automatically from component marks" />
          </Sequence>
          <Sequence from={220} durationInFrames={80}>
            <StepCaption step={3} text='Click "Save Marks" to save all entries' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AttendanceScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.5" title="Attendance" />
          {/* Date nav + filters */}
          <Sequence from={10} durationInFrames={400}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 14, fontFamily: "sans-serif" }}>← Apr 7, 2026 →</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif" }}>Class: 5</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "sans-serif" }}>Section: A</div>
              <div style={{ marginLeft: "auto", background: "rgba(34,197,94,0.2)", borderRadius: 10, padding: "8px 14px", color: "#34d399", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif" }}>Mark All Present</div>
            </div>
          </Sequence>
          {/* Attendance list */}
          <Sequence from={30} durationInFrames={350}>
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
                      <div key={btn.key} style={{ width: 36, height: 36, borderRadius: 8, background: student.status === btn.key ? btn.color + "33" : "rgba(255,255,255,0.06)", border: student.status === btn.key ? `2px solid ${btn.color}` : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: student.status === btn.key ? btn.color : "rgba(255,255,255,0.4)" }}>
                        {btn.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={60}>
            <StepCaption step={1} text="Select Date, Class, and Section" />
          </Sequence>
          <Sequence from={60} durationInFrames={70}>
            <StepCaption step={2} text="Mark each student as Present (✓), Absent (✗), or Late (⏰)" />
          </Sequence>
          <Sequence from={130} durationInFrames={70}>
            <StepCaption text='Use "Mark All Present" to quickly mark everyone, then adjust individually' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ReportCardsScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Student Progress" items={["Dashboard", ...progressItems]} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.6" title="Report Cards" />
          {/* Tabs */}
          <Sequence from={10} durationInFrames={500}>
            <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
              {["Individual", "Class"].map((tab, i) => (
                <div key={tab} style={{ padding: "10px 24px", fontSize: 14, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#a5b4fc" : "rgba(255,255,255,0.5)", borderBottom: i === 0 ? "2px solid #6366f1" : "2px solid transparent", fontFamily: "sans-serif" }}>{tab}</div>
              ))}
            </div>
          </Sequence>
          {/* Report card mockup */}
          <Sequence from={30} durationInFrames={400}>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", padding: 24 }}>
              {/* Student info */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 16 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, fontFamily: "sans-serif" }}>Aarav Sharma</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "sans-serif", marginTop: 4 }}>Class 5 - Section A | Roll No: 12</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, padding: "8px 16px", color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: "sans-serif", height: "fit-content" }}>🖨 Print</div>
              </div>
              {/* Marks table */}
              <MockTable
                headers={["Subject", "Periodic /20", "Notebook /10", "SEE /60", "Total /100", "Grade"]}
                rows={[
                  ["Mathematics", "18", "9", "52", "79", "B1"],
                  ["Science", "20", "10", "58", "88", "A2"],
                  ["English", "17", "8", "50", "75", "B1"],
                  ["Hindi", "19", "9", "55", "83", "A2"],
                ]}
                delay={15}
              />
              {/* Attendance summary */}
              <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                <MockCard title="Attendance" value="92%" color="#34d399" delay={40} />
                <MockCard title="Overall Grade" value="A2" color="#a5b4fc" delay={45} />
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={70}>
            <StepCaption step={1} text="Go to Report Cards → Select Year, Class, and Student" />
          </Sequence>
          <Sequence from={70} durationInFrames={80}>
            <StepCaption text="View subject-wise marks, component breakdown, grades, and attendance" />
          </Sequence>
          <Sequence from={150} durationInFrames={80}>
            <StepCaption step={2} text='Click "Print" for individual or "Print All" for bulk class report cards' />
          </Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Ch6Progress: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={FPS * 4}>
        <ChapterTitle chapterNumber={6} title="Student Progress" subtitle="Dashboard, marks, attendance & report cards" />
      </Sequence>
      <Sequence from={FPS * 4} durationInFrames={FPS * 35}>
        <DashboardScene />
      </Sequence>
      <Sequence from={FPS * 39} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Subjects →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 41} durationInFrames={FPS * 30}>
        <SubjectsScene />
      </Sequence>
      <Sequence from={FPS * 71} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Assessments →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 73} durationInFrames={FPS * 35}>
        <AssessmentsScene />
      </Sequence>
      <Sequence from={FPS * 108} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Marks Entry →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 110} durationInFrames={FPS * 40}>
        <MarksEntryScene />
      </Sequence>
      <Sequence from={FPS * 150} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Attendance →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 152} durationInFrames={FPS * 35}>
        <AttendanceScene />
      </Sequence>
      <Sequence from={FPS * 187} durationInFrames={FPS * 2}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif" }}>Next: Report Cards →</div>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={FPS * 189} durationInFrames={FPS * 51}>
        <ReportCardsScene />
      </Sequence>
    </AbsoluteFill>
  );
};
