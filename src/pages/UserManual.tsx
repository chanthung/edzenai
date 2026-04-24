import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

const manualSections = [
  {
    title: "Getting Started",
    icon: CheckCircle2,
    items: ["Complete school profile", "Create academic year", "Add students", "Configure fee setup", "Invite users"],
  },
  {
    title: "Student & Family Records",
    icon: Users,
    items: ["Manual student entry", "Excel import with issue report", "Sibling grouping", "Parent portal link sharing", "Birthday reminders"],
  },
  {
    title: "Fee Management",
    icon: Receipt,
    items: ["Fee categories and structures", "Installments", "Class-based assignment", "Payment recording", "Pending proof review"],
  },
  {
    title: "Student Progress",
    icon: GraduationCap,
    items: ["Subjects", "Assessments", "Marks entry", "Attendance", "Report cards", "AI insights"],
  },
];

const workflows = [
  {
    title: "Assessment Templates → Assessments",
    description:
      "Settings stores reusable assessment templates. Class Assignment links a template to each class and creates the matching Student Progress assessments for the active academic year.",
    callouts: ["Add dates on template terms", "Sync after assignment", "Use one template consistently across classes"],
  },
  {
    title: "Attendance Time Tracking",
    description:
      "Attendance is intentionally time-based instead of timetable-based. The recorded time is saved with attendance and included in Excel export for class-period tracking.",
    callouts: ["Select date and time", "Mark attendance", "Auto-save completes quickly", "Export includes Time column"],
  },
  {
    title: "Teacher Portal Filtering",
    description:
      "Teachers only see assigned classes and subjects in Marks Entry and Report Cards, keeping the workflow focused and protecting unrelated class data.",
    callouts: ["Assigned classes only", "Subject-class mapping", "Admin controls access"],
  },
];

const featureHighlights: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Settings, title: "Settings", text: "School profile, QR code, message templates, assessment templates, grade mappings, and class assignment." },
  { icon: ClipboardList, title: "Assessments", text: "Assessment types are created from class-linked templates and can carry term dates into Student Progress." },
  { icon: FileSpreadsheet, title: "Exports", text: "Excel exports include key operational fields such as attendance time and fee/payment status." },
  { icon: CalendarCheck, title: "Attendance", text: "Fast auto-save, date and time selection, status marking, and teacher-friendly class tracking." },
  { icon: ShieldCheck, title: "Access Control", text: "Admins manage users; teachers see only assigned classes and subjects in progress workflows." },
  { icon: Sparkles, title: "AI Tools", text: "Template generation, payment proof OCR, collection anomaly analysis, and progress insights where enabled." },
];

const ScreenshotPanel = ({ title, markers }: { title: string; markers: string[] }) => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
    <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
      <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-status-due/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-status-paid/70" />
      <span className="ml-3 text-xs font-semibold text-foreground">{title}</span>
    </div>
    <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr]">
      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/40 p-3">
        {markers.slice(0, 4).map((marker, index) => (
          <div
            key={marker}
            className={cn(
              "rounded-lg bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm",
              index === 1 && "border border-primary bg-primary/10 text-primary"
            )}
          >
            {marker}
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{markers[1] || title}</p>
            <p className="text-xs text-muted-foreground">Highlighted setup area</p>
          </div>
          <div className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary ring-2 ring-primary/25">
            Action button
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-primary bg-primary/10 p-3 text-xs font-semibold text-primary">
            {markers[2] || "Primary field"}
          </div>
          <div className="rounded-xl border border-border bg-muted/60 p-3 text-xs font-medium text-muted-foreground">
            Supporting data
          </div>
          <div className="rounded-xl border-2 border-status-paid bg-status-paid/10 p-3 text-xs font-semibold text-status-paid">
            Synced result
          </div>
        </div>
        <div className="space-y-2">
          {markers.slice(0, 3).map((marker, row) => (
            <div key={`${marker}-${row}`} className="grid grid-cols-[1fr_90px_90px] gap-2">
              <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{marker}</div>
              <div className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">Date/Time</div>
              <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">Export</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function UserManual() {
  const { isTeacher, isSchoolAdmin } = useUserRole();
  const Layout = isTeacher && !isSchoolAdmin ? ProgressLayout : AdminLayout;

  return (
    <Layout>
      <div className="space-y-8">
        <section className="rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground shadow-floating sm:p-8">
          <Badge className="mb-4 border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/15">
            Updated today
          </Badge>
          <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl">EdZen AI User Manual</h1>
              <p className="max-w-3xl text-sm leading-6 text-primary-foreground/85 sm:text-base">
                A practical guide for school admins, teachers, accountants, and parents covering setup, fees, progress,
                attendance, report cards, exports, and today’s latest workflow updates.
              </p>
            </div>
            <Button asChild variant="secondary" className="w-full justify-between bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <a href="/EdZen_User_Manual_2026-04-24.pdf" target="_blank" rel="noreferrer">
                Download PDF <FileText className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {manualSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-status-paid" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Highlighted workflows</h2>
            {workflows.map((workflow) => (
              <Card key={workflow.title}>
                <CardHeader>
                  <CardTitle className="text-base">{workflow.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-muted-foreground">{workflow.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {workflow.callouts.map((callout) => (
                      <Badge key={callout} variant="secondary">{callout}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4">
            <ScreenshotPanel title="Assessment Templates and Grade Mapping" markers={["Settings", "Templates", "Terms", "Grade Mapping"]} />
            <ScreenshotPanel title="Attendance Export with Time" markers={["Progress", "Attendance", "Time", "Export"]} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureHighlights.map(({ icon: Icon, title, text }) => {
            return (
              <Card key={title}>
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recommended reading order</h2>
              <p className="mt-1 text-sm text-muted-foreground">Start with setup, then fees, then Student Progress and teacher workflows.</p>
            </div>
            <Button asChild>
              <Link to="/admin/getting-started">
                Open Getting Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}