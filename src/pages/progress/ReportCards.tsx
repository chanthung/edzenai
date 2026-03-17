import { useState } from "react";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportCardView } from "@/components/progress/ReportCardView";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useResolvedAcademicYears, useResolvedActiveAcademicYear } from "@/hooks/progress/useResolvedAcademicYears";
import { useReportCard } from "@/hooks/progress/useReportCard";
import { FileText } from "lucide-react";

export default function ReportCards() {
  const { data: students = [], isLoading: studentsLoading } = useResolvedStudents();
  const { data: academicYears = [], isLoading: yearsLoading } = useResolvedAcademicYears();
  const activeYear = useResolvedActiveAcademicYear();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");

  // Use active year as default once loaded
  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const classNames = [...new Set(students.map(s => s.class_name).filter(Boolean) as string[])].sort();
  const filteredStudents = selectedClass && selectedClass !== "__all__"
    ? students.filter(s => s.class_name === selectedClass)
    : students;

  const { data: reportCard, isLoading: reportLoading } = useReportCard(
    selectedStudentId || null,
    effectiveYearId || null
  );

  return (
    <ProgressLayout>
      <PageHeader
        title="Report Cards"
        description="Generate and print student report cards with term-wise marks and grades"
      />

      {/* Filters */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Academic Year */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Academic Year</label>
              {yearsLoading ? (
                <Skeleton className="h-9 w-40" />
              ) : (
                <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map(y => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Class */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Class</label>
              {studentsLoading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudentId(""); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Classes</SelectItem>
                    {classNames.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Student */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Student</label>
              {studentsLoading ? (
                <Skeleton className="h-9 w-52" />
              ) : (
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.roll_number ? `(${s.roll_number})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Card Display */}
      <div className="mt-6">
        {!selectedStudentId ? (
          <EmptyState
            icon={FileText}
            title="Select a student"
            description="Choose a class and student above to generate their report card"
          />
        ) : reportLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
          </div>
        ) : !reportCard || (reportCard.scholastic.length === 0 && reportCard.coScholastic.length === 0) ? (
          <EmptyState
            icon={FileText}
            title="No marks data"
            description="This student doesn't have any marks recorded for the selected academic year"
          />
        ) : (
          <ReportCardView data={reportCard} />
        )}
      </div>
    </ProgressLayout>
  );
}
