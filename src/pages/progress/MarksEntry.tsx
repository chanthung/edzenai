import { useState, useMemo } from "react";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssessments } from "@/hooks/progress/useAssessments";
import { useSubjects } from "@/hooks/progress/useSubjects";
import { useSaveMarks, useStudentMarks } from "@/hooks/progress/useStudentMarks";
import { useAcademicYears, useActiveAcademicYear } from "@/hooks/useAcademicYears";
import { useStudents } from "@/hooks/useStudents";
import { PenLine, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarkEntry {
  studentId: string;
  subjectId: string;
  marksObtained: string;
  maxMarks: string;
}

export default function MarksEntry() {
  const { data: academicYears = [] } = useAcademicYears();
  const activeYear = useActiveAcademicYear();
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const effectiveYearId = selectedYearId || activeYear?.id || "";
  
  const { data: assessments = [] } = useAssessments(effectiveYearId);
  const { data: subjects = [] } = useSubjects();
  const { data: students = [] } = useStudents();
  const saveMarks = useSaveMarks();
  const { toast } = useToast();

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [defaultMaxMarks, setDefaultMaxMarks] = useState("100");

  const { data: existingMarks = [] } = useStudentMarks(selectedAssessmentId || undefined);

  const uniqueClasses = [...new Set(students.map((s) => s.class_name).filter(Boolean))] as string[];

  // Filter students by class
  const filteredStudents = useMemo(() => {
    return selectedClass
      ? students.filter((s) => s.class_name === selectedClass)
      : students;
  }, [students, selectedClass]);

  // Initialize marks from existing data
  useMemo(() => {
    if (selectedAssessmentId && selectedSubjectId && existingMarks.length > 0) {
      const newMarks: Record<string, MarkEntry> = {};
      existingMarks.forEach((mark) => {
        if (mark.subject_id === selectedSubjectId) {
          newMarks[mark.student_id] = {
            studentId: mark.student_id,
            subjectId: mark.subject_id,
            marksObtained: mark.marks_obtained.toString(),
            maxMarks: mark.max_marks.toString(),
          };
        }
      });
      setMarks(newMarks);
    } else if (!selectedAssessmentId || !selectedSubjectId) {
      setMarks({});
    }
  }, [selectedAssessmentId, selectedSubjectId, existingMarks]);

  const handleMarkChange = (studentId: string, field: "marksObtained" | "maxMarks", value: string) => {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        subjectId: selectedSubjectId,
        marksObtained: field === "marksObtained" ? value : (prev[studentId]?.marksObtained || ""),
        maxMarks: field === "maxMarks" ? value : (prev[studentId]?.maxMarks || defaultMaxMarks),
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedAssessmentId || !selectedSubjectId) {
      toast({ title: "Please select an assessment and subject", variant: "destructive" });
      return;
    }

    const marksToSave = Object.values(marks)
      .filter((m) => m.marksObtained && !isNaN(parseFloat(m.marksObtained)))
      .map((m) => ({
        student_id: m.studentId,
        assessment_id: selectedAssessmentId,
        subject_id: selectedSubjectId,
        marks_obtained: parseFloat(m.marksObtained),
        max_marks: parseFloat(m.maxMarks) || 100,
      }));

    if (marksToSave.length === 0) {
      toast({ title: "No marks to save", variant: "destructive" });
      return;
    }

    try {
      await saveMarks.mutateAsync(marksToSave);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const canSave = selectedAssessmentId && selectedSubjectId && Object.values(marks).some((m) => m.marksObtained);

  return (
    <ProgressLayout>
      <PageHeader
        title="Marks Entry"
        description="Enter student marks for assessments"
      />

      <div className="mt-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
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

          <Select 
            value={selectedAssessmentId || "none"} 
            onValueChange={(v) => setSelectedAssessmentId(v === "none" ? "" : v)}
            disabled={assessments.length === 0}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select Assessment" />
            </SelectTrigger>
            <SelectContent>
              {assessments.length === 0 ? (
                <SelectItem value="none" disabled>No assessments</SelectItem>
              ) : (
                assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select 
            value={selectedSubjectId || "none"} 
            onValueChange={(v) => setSelectedSubjectId(v === "none" ? "" : v)}
            disabled={subjects.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.length === 0 ? (
                <SelectItem value="none" disabled>No subjects</SelectItem>
              ) : (
                subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Max:</span>
            <Input
              type="number"
              value={defaultMaxMarks}
              onChange={(e) => setDefaultMaxMarks(e.target.value)}
              className="w-20"
              min="1"
            />
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Enter Marks</CardTitle>
            <Button onClick={handleSave} disabled={!canSave || saveMarks.isPending}>
              {saveMarks.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Marks
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedAssessmentId || !selectedSubjectId ? (
              <EmptyState
                icon={PenLine}
                title="Select assessment and subject"
                description="Choose an assessment and subject to enter marks for students."
              />
            ) : filteredStudents.length === 0 ? (
              <EmptyState
                icon={PenLine}
                title="No students found"
                description="No students match the selected filters."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="w-[120px]">Marks Obtained</TableHead>
                    <TableHead className="w-[100px]">Max Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-muted-foreground">{student.roll_number || "-"}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.class_name}
                        {student.section && ` - ${student.section}`}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={marks[student.id]?.marksObtained || ""}
                          onChange={(e) => handleMarkChange(student.id, "marksObtained", e.target.value)}
                          placeholder="0"
                          min="0"
                          max={parseFloat(marks[student.id]?.maxMarks || defaultMaxMarks)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={marks[student.id]?.maxMarks || defaultMaxMarks}
                          onChange={(e) => handleMarkChange(student.id, "maxMarks", e.target.value)}
                          min="1"
                          className="w-full"
                        />
                      </TableCell>
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
