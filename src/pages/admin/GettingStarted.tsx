import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useStudents } from "@/hooks/useStudents";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { BulkStudentUpload } from "@/components/admin/BulkStudentUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import edzenIcon from "@/assets/edzen-icon.png";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  UserPlus,
  CheckCircle2,
  Sparkles,
  SkipForward,
  Loader2,
  GraduationCap,
  Calendar,
  Wallet,
  Users,
} from "lucide-react";
import {
  DEFAULT_CLASSES,
  DEFAULT_SECTIONS,
  DEFAULT_FEES,
  defaultYearName,
  previewSummary,
  executeOnboarding,
  type OnboardingFeeRow,
} from "@/lib/onboarding-engine";
import {
  BOARD_LABELS,
  CLASS_GROUP_LABELS,
  type Board,
  type Stream,
} from "@/lib/subject-library";

const BOARDS: Board[] = ["CBSE", "ICSE", "ISC", "STATE_BOARD"];
const STREAMS: { id: Stream; label: string }[] = [
  { id: "science", label: "Science" },
  { id: "commerce", label: "Commerce" },
  { id: "arts", label: "Arts" },
];

type Step = "configure" | "preview" | "done";

export default function GettingStarted() {
  const navigate = useNavigate();
  const { data: school } = useSchool();
  const { data: students, refetch: refetchStudents } = useStudents();
  const { data: academicYears } = useAcademicYears();

  const [step, setStep] = useState<Step>("configure");
  const [executing, setExecuting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Form state
  const initialYear = useMemo(() => defaultYearName(), []);
  const [schoolName, setSchoolName] = useState("");
  const [board, setBoard] = useState<Board>("CBSE");
  const [yearName, setYearName] = useState(initialYear.name);
  const [yearStart, setYearStart] = useState(initialYear.start);
  const [yearEnd, setYearEnd] = useState(initialYear.end);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(DEFAULT_CLASSES);
  const [selectedSections, setSelectedSections] = useState<string[]>(["A", "B"]);
  const [selectedStreams, setSelectedStreams] = useState<Stream[]>(["science", "commerce", "arts"]);
  const [fees, setFees] = useState<OnboardingFeeRow[]>(DEFAULT_FEES);
  const [resultSummary, setResultSummary] = useState<string>("");

  // Hydrate from existing school
  useEffect(() => {
    if (!school) return;
    if (school.onboarding_completed) {
      navigate("/admin", { replace: true });
      return;
    }
    if (school.name) setSchoolName(school.name);
    if (school.board && BOARDS.includes(school.board as Board)) {
      setBoard(school.board as Board);
    }
    if (school.default_classes?.length) setSelectedClasses(school.default_classes);
    if (school.default_sections?.length) setSelectedSections(school.default_sections);
  }, [school, navigate]);

  const studentCount = students?.length ?? 0;
  const hasSenior = selectedClasses.some((c) => c === "Class 11" || c === "Class 12");

  const summary = useMemo(() => {
    if (!school) return null;
    return previewSummary({
      schoolId: school.id,
      schoolName,
      board,
      yearName,
      yearStart,
      yearEnd,
      classes: selectedClasses,
      sections: selectedSections,
      streams: hasSenior ? selectedStreams : [],
      fees,
    });
  }, [school, schoolName, board, yearName, yearStart, yearEnd, selectedClasses, selectedSections, selectedStreams, hasSenior, fees]);

  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleSkip = async () => {
    if (!school) return;
    await supabase.from("schools").update({ onboarding_completed: true }).eq("id", school.id);
    navigate("/admin", { replace: true });
  };

  const handleCreate = async () => {
    if (!school || !summary) return;
    setExecuting(true);
    try {
      const result = await executeOnboarding({
        schoolId: school.id,
        schoolName,
        board,
        yearName,
        yearStart,
        yearEnd,
        classes: selectedClasses,
        sections: selectedSections,
        streams: hasSenior ? selectedStreams : [],
        fees,
      });
      const totalNew =
        (result.yearCreated ? 1 : 0) +
        result.subjectsCreated +
        result.feeCategoriesCreated +
        result.feeStructuresCreated;
      setResultSummary(
        totalNew === 0
          ? "Already set up — added 0 new items"
          : `Created ${result.subjectsCreated} new subjects · ${result.feeStructuresCreated} fee structures · ${result.classAssignments} class assignments`
      );
      if (result.errors.length > 0) {
        toast.warning(`Setup completed with ${result.errors.length} warning(s)`, {
          description: result.errors[0],
        });
      } else {
        toast.success("School setup complete");
      }
      setStep("done");
    } catch (e) {
      toast.error("Setup failed", { description: (e as Error).message });
    } finally {
      setExecuting(false);
    }
  };

  const stepIndex = step === "configure" ? 0 : step === "preview" ? 1 : 2;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-3">
            <img src={edzenIcon} alt="EdZen AI" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">One-Click School Setup</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure everything in under a minute
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["Configure", "Preview", "Done"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  i < stepIndex
                    ? "bg-primary/10 text-primary"
                    : i === stepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                {label}
              </div>
              {i < 2 && <div className={cn("w-6 h-0.5", i < stepIndex ? "bg-primary" : "bg-muted")} />}
            </div>
          ))}
        </div>

        {/* CONFIGURE */}
        {step === "configure" && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Configure Your School</CardTitle>
              <CardDescription>
                Pick your board, classes, sections, and starter fees. We'll create everything in one go.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* School name */}
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input
                  id="school-name"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Stepping Stones School"
                />
              </div>

              {/* Board */}
              <div className="space-y-2">
                <Label>Board</Label>
                <RadioGroup
                  value={board}
                  onValueChange={(v) => setBoard(v as Board)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {BOARDS.map((b) => (
                    <label
                      key={b}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                        board === b ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value={b} />
                      <span className="text-sm font-medium">{BOARD_LABELS[b]}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Academic year */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Academic Year
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="2025-26" />
                  <Input type="date" value={yearStart} onChange={(e) => setYearStart(e.target.value)} />
                  <Input type="date" value={yearEnd} onChange={(e) => setYearEnd(e.target.value)} />
                </div>
              </div>

              {/* Classes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Classes
                  <span className="text-xs text-muted-foreground font-normal">
                    ({selectedClasses.length} selected)
                  </span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CLASSES.map((c) => (
                    <Badge
                      key={c}
                      variant={selectedClasses.includes(c) ? "default" : "outline"}
                      className="cursor-pointer select-none px-3 py-1.5 text-sm"
                      onClick={() => setSelectedClasses(toggle(selectedClasses, c))}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Sections per class
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SECTIONS.map((s) => (
                    <Badge
                      key={s}
                      variant={selectedSections.includes(s) ? "default" : "outline"}
                      className="cursor-pointer select-none px-3 py-1.5 text-sm"
                      onClick={() => setSelectedSections(toggle(selectedSections, s))}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Streams (only if Class 11/12 picked) */}
              {hasSenior && (
                <div className="space-y-2">
                  <Label>Streams (Class 11–12)</Label>
                  <div className="flex flex-wrap gap-2">
                    {STREAMS.map((s) => (
                      <Badge
                        key={s.id}
                        variant={selectedStreams.includes(s.id) ? "default" : "outline"}
                        className="cursor-pointer select-none px-3 py-1.5 text-sm"
                        onClick={() => setSelectedStreams(toggle(selectedStreams, s.id))}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fees */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Starter Fee Setup
                </Label>
                <div className="space-y-2">
                  {fees.map((fee, idx) => (
                    <div
                      key={fee.name}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Checkbox
                        checked={fee.enabled}
                        onCheckedChange={(checked) =>
                          setFees((prev) =>
                            prev.map((f, i) => (i === idx ? { ...f, enabled: !!checked } : f))
                          )
                        }
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{fee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fee.is_mandatory ? "Mandatory" : "Optional"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={fee.amount}
                          onChange={(e) =>
                            setFees((prev) =>
                              prev.map((f, i) =>
                                i === idx ? { ...f, amount: parseFloat(e.target.value) || 0 } : f
                              )
                            )
                          }
                          className="w-28 h-9"
                          disabled={!fee.enabled}
                        />
                        <span className="text-xs text-muted-foreground">/year</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep("preview")}
                  className="flex-1 gap-2"
                  disabled={!schoolName.trim() || selectedClasses.length === 0 || selectedSections.length === 0}
                >
                  Preview Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground gap-1">
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PREVIEW */}
        {step === "preview" && summary && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Review Your Setup</CardTitle>
              <CardDescription>
                Nothing is created yet. Confirm to apply — re-running later won't create duplicates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <PreviewItem
                  icon={<Calendar className="h-4 w-4" />}
                  label="Academic Year"
                  value={`${summary.yearName} (${summary.yearStart} – ${summary.yearEnd})`}
                />
                <PreviewItem
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Classes × Sections"
                  value={`${summary.classCount} × ${summary.sectionCount} = ${summary.classCount * summary.sectionCount} class-sections`}
                />
                <PreviewItem
                  icon={<Sparkles className="h-4 w-4" />}
                  label={`Subjects (${BOARD_LABELS[board]})`}
                  value={`${summary.totalSubjects} unique subjects`}
                />
                <PreviewItem
                  icon={<Wallet className="h-4 w-4" />}
                  label="Fees"
                  value={`${summary.feeCategoryCount} categor${summary.feeCategoryCount === 1 ? "y" : "ies"} · ${summary.feeStructureCount} structure${summary.feeStructureCount === 1 ? "" : "s"}`}
                />
              </div>

              {summary.totalSubjects > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Subject breakdown</p>
                  <p className="text-muted-foreground text-xs">
                    {(Object.keys(summary.subjectsByGroup) as (keyof typeof summary.subjectsByGroup)[])
                      .filter((g) => summary.subjectsByGroup[g] > 0)
                      .map((g) => `${CLASS_GROUP_LABELS[g]}: ${summary.subjectsByGroup[g]}`)
                      .join(" · ")}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("configure")} className="flex-1 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={executing} className="flex-1 gap-2">
                  {executing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {executing ? "Creating..." : "Create Everything"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* DONE */}
        {step === "done" && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardContent className="pt-10 pb-10 space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Your school is ready 🎉</h2>
                <p className="text-muted-foreground text-sm">{resultSummary}</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  onClick={() => navigate("/admin/students")}
                  className="p-4 rounded-xl border hover:bg-muted/50 transition-colors text-center space-y-2"
                >
                  <UserPlus className="h-6 w-6 text-primary mx-auto" />
                  <p className="font-medium text-sm">Add Students</p>
                  <p className="text-xs text-muted-foreground">One at a time</p>
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-center space-y-2"
                >
                  <Upload className="h-6 w-6 text-primary mx-auto" />
                  <p className="font-medium text-sm">Import Excel</p>
                  <p className="text-xs text-muted-foreground">Recommended</p>
                </button>
                <button
                  onClick={() => navigate("/admin/teachers")}
                  className="p-4 rounded-xl border hover:bg-muted/50 transition-colors text-center space-y-2"
                >
                  <Users className="h-6 w-6 text-primary mx-auto" />
                  <p className="font-medium text-sm">Invite Teachers</p>
                  <p className="text-xs text-muted-foreground">Add staff</p>
                </button>
              </div>

              {studentCount > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {studentCount} student{studentCount !== 1 ? "s" : ""} already added
                  </p>
                </div>
              )}

              <div className="text-center pt-2">
                <Button onClick={() => navigate("/admin")} size="lg" className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <BulkStudentUpload
        open={showBulkUpload}
        onOpenChange={(open) => {
          setShowBulkUpload(open);
          if (!open) refetchStudents();
        }}
      />
    </AdminLayout>
  );
}

function PreviewItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border bg-card space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
