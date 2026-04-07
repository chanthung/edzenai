import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockForm } from "../components/MockForm";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_3_Assessments: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Assessments" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.3" title="Assessments" />
          <Sequence from={15} durationInFrames={700}>
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <MockForm title="Add Assessment" fields={[
                  { label: "Name", value: "Mid-Term Exam" },
                  { label: "Type", value: "Mid Term" },
                  { label: "Date", value: "Sep 15, 2025" },
                  { label: "Domain (NEP)", value: "Cognitive" },
                  { label: "Category", value: "Summative" },
                ]} buttonText="Create Assessment" delay={0} />
              </div>
              <div style={{ flex: 1 }}>
                <MockTable headers={["Assessment", "Type", "Date"]} rows={[
                  ["Unit Test 1", "Unit Test", "Jul 20"],
                  ["Mid-Term", "Mid Term", "Sep 15"],
                  ["Quiz 1", "Quiz", "Aug 5"],
                ]} delay={30} />
              </div>
            </div>
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text='Go to Assessments → Click "+ Add Assessment"' /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Fill Name, Type, Date, NEP Domain, Category" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text="Leave Class empty for school-wide exams" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
