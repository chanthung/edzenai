import { AbsoluteFill, Sequence } from "remotion";
import { Background } from "../components/Background";
import { MockSidebar } from "../components/MockSidebar";
import { MockTable } from "../components/MockTable";
import { StepCaption } from "../components/StepCaption";
import { SectionTitle } from "../components/SectionTitle";

const nav = ["Dashboard", "Subjects", "Assessments", "Marks Entry", "Attendance", "Report Cards"];

export const S6_2_Subjects: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ display: "flex", height: "100%" }}>
        <MockSidebar activeItem="Subjects" items={nav} />
        <div style={{ flex: 1, padding: 40, position: "relative" }}>
          <SectionTitle number="6.2" title="Subjects" />
          <Sequence from={15} durationInFrames={600}>
            <MockTable headers={["Subject", "Code", "Type", "Classes"]} rows={[
              ["Mathematics", "MATH", "Scholastic", "1, 2, 3, 4, 5"],
              ["Science", "SCI", "Scholastic", "3, 4, 5"],
              ["English", "ENG", "Scholastic", "1, 2, 3, 4, 5"],
              ["Hindi", "HIN", "Scholastic", "1, 2, 3, 4, 5"],
              ["Art & Craft", "ART", "Co-Scholastic", "1, 2, 3"],
            ]} delay={0} />
          </Sequence>
          <Sequence from={0} durationInFrames={150}><StepCaption step={1} text='Go to Subjects → Click "+ Add Subject"' /></Sequence>
          <Sequence from={150} durationInFrames={200}><StepCaption step={2} text="Enter Name, Code, Type, and assign to classes" /></Sequence>
          <Sequence from={350} durationInFrames={200}><StepCaption text="Subjects must exist before creating assessments or entering marks" /></Sequence>
        </div>
      </div>
    </AbsoluteFill>
  );
};
