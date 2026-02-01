import { useState } from "react";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressIndicator } from "@/components/progress/ProgressIndicator";
import { AtRiskBadge } from "@/components/progress/AtRiskBadge";
import { useProgressAnalytics, type ProgressStatus } from "@/hooks/progress/useProgressAnalytics";
import { useAcademicYears, useActiveAcademicYear } from "@/hooks/useAcademicYears";
import { useStudents } from "@/hooks/useStudents";
import { BarChart3, Users, TrendingUp, TrendingDown, Search, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export default function ProgressDashboard() {
  const { data: academicYears = [] } = useAcademicYears();
  const activeYear = useActiveAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<ProgressStatus | "all" | "at_risk">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: students = [] } = useStudents();
  const uniqueClasses = [...new Set(students.map((s) => s.class_name).filter(Boolean))] as string[];

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  
  const { classProgress, isLoadingClassProgress } = useProgressAnalytics(
    effectiveYearId,
    selectedClass || undefined
  );

  // Filter students
  const filteredStudents = classProgress.filter((student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "at_risk" ? student.isAtRisk : student.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats
  const improvingCount = classProgress.filter((s) => s.status === "improving").length;
  const atRiskCount = classProgress.filter((s) => s.isAtRisk).length;
  const averagePercentage =
    classProgress.length > 0
      ? Math.round(
          classProgress.reduce((sum, s) => sum + s.averagePercentage, 0) / classProgress.length
        )
      : 0;

  return (
    <ProgressLayout>
      <PageHeader
        title="Progress Dashboard"
        description="Monitor student performance and identify trends"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Select value={effectiveYearId || "none"} onValueChange={(v) => setSelectedYearId(v === "none" ? "" : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Academic Year" />
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

        <Select value={selectedClass || "all"} onValueChange={(v) => setSelectedClass(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Classes" />
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

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="improving">Improving</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
            <SelectItem value="declining">Declining</SelectItem>
            <SelectItem value="at_risk">At Risk</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{classProgress.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{averagePercentage}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Improving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-600">{improvingCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{atRiskCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingClassProgress ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-32 mb-2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No progress data yet"
              description="Start by adding subjects and assessments, then enter student marks to see progress trends."
            />
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {student.studentName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.studentName}</span>
                        {student.isAtRisk && <AtRiskBadge showLabel={false} />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {student.className}
                        {student.section && ` - ${student.section}`}
                        {student.rollNumber && ` | Roll: ${student.rollNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">{student.averagePercentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {student.assessmentCount} assessment{student.assessmentCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ProgressIndicator status={student.status} size="sm" />
                    <Link to={`/progress/student/${student.studentId}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ProgressLayout>
  );
}
