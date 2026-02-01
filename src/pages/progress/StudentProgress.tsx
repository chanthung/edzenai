import { useParams, Link } from "react-router-dom";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressIndicator } from "@/components/progress/ProgressIndicator";
import { AtRiskBadge } from "@/components/progress/AtRiskBadge";
import { useStudentMarksByStudent } from "@/hooks/progress/useStudentMarks";
import { useStudents } from "@/hooks/useStudents";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function StudentProgress() {
  const { studentId } = useParams<{ studentId: string }>();
  const { data: students = [] } = useStudents();
  const { data: marks = [], isLoading } = useStudentMarksByStudent(studentId || "");

  const student = students.find((s) => s.id === studentId);

  // Group marks by assessment
  const assessmentGroups = marks.reduce((acc, mark) => {
    const assessmentId = mark.assessments?.id;
    if (!assessmentId) return acc;
    
    if (!acc[assessmentId]) {
      acc[assessmentId] = {
        name: mark.assessments?.name || "",
        date: mark.assessments?.assessment_date,
        type: mark.assessments?.assessment_type || "",
        marks: [],
      };
    }
    acc[assessmentId].marks.push({
      subject: mark.subjects?.name || "",
      obtained: mark.marks_obtained,
      max: mark.max_marks,
      percentage: Math.round((mark.marks_obtained / mark.max_marks) * 100),
    });
    return acc;
  }, {} as Record<string, { name: string; date: string | null; type: string; marks: Array<{ subject: string; obtained: number; max: number; percentage: number }> }>);

  const assessmentList = Object.entries(assessmentGroups)
    .map(([id, data]) => ({
      id,
      ...data,
      average: Math.round(data.marks.reduce((sum, m) => sum + m.percentage, 0) / data.marks.length),
    }))
    .sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Calculate overall stats
  const totalMarks = marks.length;
  const overallAverage = totalMarks > 0
    ? Math.round(marks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / totalMarks)
    : 0;

  // Calculate trend
  let trend = 0;
  let status: "improving" | "stable" | "declining" | "new" = "new";
  if (assessmentList.length >= 2) {
    const latest = assessmentList[0].average;
    const previous = assessmentList[1].average;
    trend = latest - previous;
    if (trend >= 5) status = "improving";
    else if (trend <= -5) status = "declining";
    else status = "stable";
  }

  const isAtRisk = status === "declining" || overallAverage < 40;

  if (!student) {
    return (
      <ProgressLayout>
        <EmptyState
          icon={BarChart3}
          title="Student not found"
          description="The student you're looking for doesn't exist."
        />
      </ProgressLayout>
    );
  }

  return (
    <ProgressLayout>
      <div className="mb-4">
        <Link to="/progress">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        title={student.name}
        description={`${student.class_name}${student.section ? ` - ${student.section}` : ""} | Roll: ${student.roll_number || "N/A"}`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{overallAverage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{assessmentList.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {trend > 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : trend < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : null}
              <span className={`text-2xl font-bold ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : ""}`}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ProgressIndicator status={status} size="sm" />
              {isAtRisk && <AtRiskBadge showLabel={false} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : assessmentList.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No assessment data"
              description="This student doesn't have any marks recorded yet."
            />
          ) : (
            <div className="space-y-4">
              {assessmentList.map((assessment) => (
                <Card key={assessment.id} className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{assessment.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {assessment.date ? format(new Date(assessment.date), "MMM d, yyyy") : "No date"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{assessment.average}%</p>
                        <p className="text-xs text-muted-foreground">Average</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {assessment.marks.map((mark, idx) => (
                        <div key={idx} className="p-2 rounded bg-background">
                          <p className="text-sm font-medium">{mark.subject}</p>
                          <p className="text-lg font-bold">
                            {mark.obtained}/{mark.max}
                            <span className="text-sm text-muted-foreground ml-1">({mark.percentage}%)</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ProgressLayout>
  );
}
