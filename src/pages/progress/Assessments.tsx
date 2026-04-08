import { useState } from "react";
import { sortClassNames } from "@/lib/class-sort";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAssessments, useCreateAssessment, useDeleteAssessment, type AssessmentDomain, type AssessmentCategory } from "@/hooks/progress/useAssessments";
import { useResolvedAcademicYears, useResolvedActiveAcademicYear } from "@/hooks/progress/useResolvedAcademicYears";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useUserRole } from "@/hooks/useUserRole";
import { ClipboardList, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ASSESSMENT_TYPES = [
  { value: "unit_test", label: "Unit Test" },
  { value: "mid_term", label: "Mid Term" },
  { value: "final_exam", label: "Final Exam" },
  { value: "term_exam", label: "Term Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "practical", label: "Practical" },
  { value: "project", label: "Project" },
  { value: "portfolio", label: "Portfolio" },
  { value: "observation", label: "Observation" },
];

const ASSESSMENT_DOMAINS: { value: AssessmentDomain; label: string }[] = [
  { value: "cognitive", label: "Cognitive" },
  { value: "affective", label: "Affective" },
  { value: "psychomotor", label: "Psychomotor" },
];

const ASSESSMENT_CATEGORIES: { value: AssessmentCategory; label: string }[] = [
  { value: "formative", label: "Formative" },
  { value: "summative", label: "Summative" },
];

export default function Assessments() {
  const { data: academicYears = [] } = useResolvedAcademicYears();
  const activeYear = useResolvedActiveAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = selectedYearId || activeYear?.id || "";
  
  const { data: assessments = [], isLoading } = useAssessments(effectiveYearId);
  const createAssessment = useCreateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const { toast } = useToast();
  const { isTeacher } = useUserRole();

  const { data: students = [] } = useResolvedStudents();
  const uniqueClasses = sortClassNames([...new Set(students.map((s) => s.class_name).filter(Boolean))] as string[]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [assessmentDate, setAssessmentDate] = useState("");
  const [className, setClassName] = useState("");
  const [assessmentDomain, setAssessmentDomain] = useState<AssessmentDomain>("cognitive");
  const [assessmentCategory, setAssessmentCategory] = useState<AssessmentCategory>("summative");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !assessmentType || !effectiveYearId) {
      toast({ title: "Name and type are required", variant: "destructive" });
      return;
    }

    try {
      await createAssessment.mutateAsync({
        academic_year_id: effectiveYearId,
        name: name.trim(),
        assessment_type: assessmentType,
        assessment_date: assessmentDate || undefined,
        class_name: className || undefined,
        assessment_domain: assessmentDomain,
        assessment_category: assessmentCategory,
      });
      setIsDialogOpen(false);
      setName("");
      setAssessmentType("");
      setAssessmentDate("");
      setClassName("");
      setAssessmentDomain("cognitive");
      setAssessmentCategory("summative");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this assessment? This will also delete all marks associated with it.")) {
      try {
        await deleteAssessment.mutateAsync(id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const getTypeLabel = (type: string) => {
    return ASSESSMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <ProgressLayout>
      <PageHeader
        title="Assessments"
        description="Create and manage assessments for student evaluation"
      />

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Select value={effectiveYearId || "none"} onValueChange={(v) => setSelectedYearId(v === "none" ? "" : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.length === 0 ? (
                <SelectItem value="none" disabled>No academic years</SelectItem>
              ) : (
                academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {!isTeacher && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!effectiveYearId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assessment
                </Button>
              </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Assessment</DialogTitle>
                  <DialogDescription>
                    Create a new assessment for the selected academic year.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Assessment Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Mid Term Exam - January"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Assessment Type *</Label>
                    <Select value={assessmentType} onValueChange={setAssessmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSESSMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Domain (NEP)</Label>
                      <Select value={assessmentDomain} onValueChange={(v) => setAssessmentDomain(v as AssessmentDomain)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSESSMENT_DOMAINS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={assessmentCategory} onValueChange={(v) => setAssessmentCategory(v as AssessmentCategory)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSESSMENT_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Assessment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Class (Optional)</Label>
                    <Select value={className || "all"} onValueChange={(v) => setClassName(v === "all" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {uniqueClasses.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAssessment.isPending}>
                    {createAssessment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card className="rounded-xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No assessments yet"
                description={
                  effectiveYearId
                    ? "Create your first assessment to start tracking student progress."
                    : "Select an academic year first to manage assessments."
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    {!isTeacher && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getTypeLabel(assessment.assessment_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{assessment.assessment_domain}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assessment.assessment_category === 'formative' ? 'default' : 'secondary'} className="capitalize">
                          {assessment.assessment_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {assessment.class_name || "All Classes"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {assessment.assessment_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(assessment.assessment_date), "MMM d, yyyy")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {!isTeacher && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(assessment.id)}
                            disabled={deleteAssessment.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProgressLayout>
  );
}
