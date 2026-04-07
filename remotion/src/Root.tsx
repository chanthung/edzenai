import { Composition } from "remotion";
import { TitleCard } from "./scenes/TitleCard";
import { S1_1_AddManually } from "./scenes/S1_1_AddManually";
import { S1_2_ExcelImport } from "./scenes/S1_2_ExcelImport";
import { S1_3_ManagingStudents } from "./scenes/S1_3_ManagingStudents";
import { S2_1_CreateYear } from "./scenes/S2_1_CreateYear";
import { S2_2_Promotions } from "./scenes/S2_2_Promotions";
import { S3_1_FeeCategories } from "./scenes/S3_1_FeeCategories";
import { S3_2_FeeStructures } from "./scenes/S3_2_FeeStructures";
import { S3_3_Installments } from "./scenes/S3_3_Installments";
import { S3_4_ClassAssignment } from "./scenes/S3_4_ClassAssignment";
import { S4_1_AddTeacher } from "./scenes/S4_1_AddTeacher";
import { S4_2_AssignSubjects } from "./scenes/S4_2_AssignSubjects";
import { S5_1_SchoolProfile } from "./scenes/S5_1_SchoolProfile";
import { S5_2_PaymentQR } from "./scenes/S5_2_PaymentQR";
import { S5_3_Templates } from "./scenes/S5_3_Templates";
import { S6_1_Dashboard } from "./scenes/S6_1_Dashboard";
import { S6_2_Subjects } from "./scenes/S6_2_Subjects";
import { S6_3_Assessments } from "./scenes/S6_3_Assessments";
import { S6_4_MarksEntry } from "./scenes/S6_4_MarksEntry";
import { S6_5_Attendance } from "./scenes/S6_5_Attendance";
import { S6_6_ReportCards } from "./scenes/S6_6_ReportCards";

const FPS = 30;
const W = 1920;
const H = 1080;

const titles = [
  { id: "t1", ch: 1, title: "Students", sub: "Add, import, and manage student records" },
  { id: "t2", ch: 2, title: "Academic Years", sub: "Manage academic periods and promotions" },
  { id: "t3", ch: 3, title: "Fee Setup", sub: "Categories, structures, installments & assignment" },
  { id: "t4", ch: 4, title: "Teachers", sub: "Add staff and assign subjects & classes" },
  { id: "t5", ch: 5, title: "Settings", sub: "School profile, QR codes & templates" },
  { id: "t6", ch: 6, title: "Student Progress", sub: "Dashboard, marks, attendance & report cards" },
];

export const RemotionRoot: React.FC = () => (
  <>
    {titles.map((t) => (
      <Composition
        key={t.id}
        id={t.id}
        component={TitleCard}
        durationInFrames={FPS * 4}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ chapterNumber: t.ch, title: t.title, subtitle: t.sub }}
      />
    ))}
    <Composition id="s1-1" component={S1_1_AddManually} durationInFrames={FPS * 35} fps={FPS} width={W} height={H} />
    <Composition id="s1-2" component={S1_2_ExcelImport} durationInFrames={FPS * 35} fps={FPS} width={W} height={H} />
    <Composition id="s1-3" component={S1_3_ManagingStudents} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
    <Composition id="s2-1" component={S2_1_CreateYear} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
    <Composition id="s2-2" component={S2_2_Promotions} durationInFrames={FPS * 35} fps={FPS} width={W} height={H} />
    <Composition id="s3-1" component={S3_1_FeeCategories} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
    <Composition id="s3-2" component={S3_2_FeeStructures} durationInFrames={FPS * 25} fps={FPS} width={W} height={H} />
    <Composition id="s3-3" component={S3_3_Installments} durationInFrames={FPS * 25} fps={FPS} width={W} height={H} />
    <Composition id="s3-4" component={S3_4_ClassAssignment} durationInFrames={FPS * 25} fps={FPS} width={W} height={H} />
    <Composition id="s4-1" component={S4_1_AddTeacher} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
    <Composition id="s4-2" component={S4_2_AssignSubjects} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
    <Composition id="s5-1" component={S5_1_SchoolProfile} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
    <Composition id="s5-2" component={S5_2_PaymentQR} durationInFrames={FPS * 22} fps={FPS} width={W} height={H} />
    <Composition id="s5-3" component={S5_3_Templates} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
    <Composition id="s6-1" component={S6_1_Dashboard} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
    <Composition id="s6-2" component={S6_2_Subjects} durationInFrames={FPS * 22} fps={FPS} width={W} height={H} />
    <Composition id="s6-3" component={S6_3_Assessments} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
    <Composition id="s6-4" component={S6_4_MarksEntry} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
    <Composition id="s6-5" component={S6_5_Attendance} durationInFrames={FPS * 25} fps={FPS} width={W} height={H} />
    <Composition id="s6-6" component={S6_6_ReportCards} durationInFrames={FPS * 28} fps={FPS} width={W} height={H} />
  </>
);
