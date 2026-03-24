import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "@/hooks/useSchool";
import { useStudents } from "@/hooks/useStudents";
import { useAcademicYears } from "@/hooks/useAcademicYears";
import { BulkStudentUpload } from "@/components/admin/BulkStudentUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Upload,
  UserPlus,
  CheckCircle2,
  Sparkles,
  Brain,
  TrendingUp,
  SkipForward,
  Loader2,
} from "lucide-react";

const CLASS_OPTIONS = [
  "Pre-School", "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12",
];

const SECTION_OPTIONS = ["A", "B", "C", "D", "E"];

export default function GettingStarted() {
  const [step, setStep] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>(["A"]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [completing, setCompleting] = useState(false);

  const navigate = useNavigate();
  const { data: school } = useSchool();
  const { data: students, refetch: refetchStudents } = useStudents();
  const { data: academicYears } = useAcademicYears();

  const activeYear = academicYears?.find((y) => y.is_active);
  const studentCount = students?.length || 0;

  // If onboarding already completed, redirect to dashboard
  useEffect(() => {
    if (school && (school as any).onboarding_completed) {
      navigate("/admin", { replace: true });
    }
  }, [school, navigate]);

  const completeOnboarding = async () => {
    if (!school) return;
    setCompleting(true);
    try {
      await supabase
        .from("schools")
        .update({ onboarding_completed: true } as any)
        .eq("id", school.id);
      navigate("/admin", { replace: true });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleSection = (sec: string) => {
    setSelectedSections((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={cn(
                    "w-8 h-0.5",
                    s < step ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardContent className="pt-10 pb-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Welcome to EdZen AI</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Let's set up your school in 2 minutes
                </p>
              </div>
              <Button size="lg" onClick={() => setStep(2)} className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: School Config */}
        {step === 2 && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Configure Your School</CardTitle>
              <CardDescription>
                Select the classes and sections in your school
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Academic Year (read-only) */}
              {activeYear && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Academic Year</p>
                  <p className="font-medium">{activeYear.name}</p>
                </div>
              )}

              {/* Classes */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Classes</p>
                <div className="flex flex-wrap gap-2">
                  {CLASS_OPTIONS.map((cls) => (
                    <Badge
                      key={cls}
                      variant={selectedClasses.includes(cls) ? "default" : "outline"}
                      className="cursor-pointer select-none px-3 py-1.5 text-sm"
                      onClick={() => toggleClass(cls)}
                    >
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Sections</p>
                <div className="flex flex-wrap gap-2">
                  {SECTION_OPTIONS.map((sec) => (
                    <Badge
                      key={sec}
                      variant={selectedSections.includes(sec) ? "default" : "outline"}
                      className="cursor-pointer select-none px-3 py-1.5 text-sm"
                      onClick={() => toggleSection(sec)}
                    >
                      {sec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 gap-2">
                  Continue
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

        {/* Step 3: Add Students */}
        {step === 3 && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle>Add Your Students</CardTitle>
              <CardDescription>
                Upload your student list to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentCount > 0 && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {studentCount} student{studentCount !== 1 ? "s" : ""} added
                  </p>
                </div>
              )}

              {/* Excel Upload - Primary */}
              <button
                onClick={() => setShowBulkUpload(true)}
                className="w-full p-6 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors text-center space-y-2"
              >
                <Upload className="h-8 w-8 text-primary mx-auto" />
                <p className="font-semibold">Upload Excel File</p>
                <p className="text-sm text-muted-foreground">
                  Recommended — Import students from a spreadsheet
                </p>
              </button>

              {/* Manual Add - Secondary */}
              <button
                onClick={() => navigate("/admin/students")}
                className="w-full p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-center space-y-1"
              >
                <UserPlus className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="font-medium text-sm">Add Manually</p>
                <p className="text-xs text-muted-foreground">
                  Add students one at a time
                </p>
              </button>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    refetchStudents();
                    setStep(4);
                  }}
                  className="flex-1 gap-2"
                  disabled={studentCount === 0}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground gap-1">
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success + AI Preview */}
        {step === 4 && (
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardContent className="pt-10 pb-10 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {studentCount > 0
                    ? `${studentCount} Students Added Successfully 🎉`
                    : "You're All Set!"}
                </h2>
                <p className="text-muted-foreground mt-1">
                  Here's what EdZen AI can do for you
                </p>
              </div>

              {/* AI Insight Preview Cards */}
              <div className="grid gap-3 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">AI Student Insights</p>
                    <p className="text-xs text-muted-foreground">
                      Detect students who may need attention in specific subjects
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Performance Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      Class performance trends and NEP 2020 aligned report cards
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Fee Transparency</p>
                    <p className="text-xs text-muted-foreground">
                      Parents can view fees and submit payment proofs instantly
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                onClick={completeOnboarding}
                disabled={completing}
                className="gap-2"
              >
                {completing && <Loader2 className="h-4 w-4 animate-spin" />}
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Upload Dialog */}
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
