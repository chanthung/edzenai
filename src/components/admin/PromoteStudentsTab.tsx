import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getNextClass, getPromotionStatus } from "@/lib/grade-promotion";
import type { AcademicYear } from "@/hooks/useAcademicYears";
import {
  ArrowRight,
  Loader2,
  GraduationCap,
  UserMinus,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";

type PromotionAction = "promote" | "retain" | "exclude";

interface EnrollmentRow {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  current_class: string | null;
  section: string | null;
  promoted_class: string | null;
  action: PromotionAction;
  autoSuggestion: PromotionAction;
  avgPercentage: number | null;
  failingSubjects: string[];
}

interface PromoteStudentsTabProps {
  academicYears: AcademicYear[];
  schoolId: string;
}

export function PromoteStudentsTab({ academicYears, schoolId }: PromoteStudentsTabProps) {
  const queryClient = useQueryClient();
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { action: PromotionAction }>>({});

  const sortedYears = useMemo(
    () => [...academicYears].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [academicYears]
  );

  const toYearOptions = useMemo(() => {
    if (!fromYearId) return [];
    const fromIdx = sortedYears.findIndex((y) => y.id === fromYearId);
    return fromIdx >= 0 ? sortedYears.slice(fromIdx + 1) : [];
  }, [sortedYears, fromYearId]);

  const handleFromChange = (v: string) => {
    setFromYearId(v);
    setToYearId("");
    setSelectedClass("");
    setOverrides({});
  };

  const handleToChange = (v: string) => {
    setToYearId(v);
    setSelectedClass("");
    setOverrides({});
  };

  // Fetch all enrollments for the source year
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments-for-promotion", fromYearId, schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("id, student_id, class_name, section, students!inner(name, school_id)")
        .eq("academic_year_id", fromYearId)
        .eq("students.school_id", schoolId);
      if (error) throw error;
      return data as Array<{
        id: string;
        student_id: string;
        class_name: string | null;
        section: string | null;
        students: { name: string; school_id: string };
      }>;
    },
    enabled: !!fromYearId && !!schoolId,
  });

  // Get unique classes from enrollments
  const availableClasses = useMemo(() => {
    if (!enrollments) return [];
    const classes = new Set(enrollments.map((e) => e.class_name).filter(Boolean) as string[]);
    return Array.from(classes).sort((a, b) => {
      const numA = parseInt((a.match(/(\d+)/) ?? [])[1] ?? "0", 10);
      const numB = parseInt((b.match(/(\d+)/) ?? [])[1] ?? "0", 10);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [enrollments]);

  // Filter enrollments by selected class
  const classEnrollments = useMemo(() => {
    if (!enrollments || !selectedClass) return [];
    return enrollments.filter((e) => e.class_name === selectedClass);
  }, [enrollments, selectedClass]);

  // Fetch student marks for the source year to determine pass/fail
  const studentIds = useMemo(() => classEnrollments.map((e) => e.student_id), [classEnrollments]);

  const { data: marksData } = useQuery({
    queryKey: ["promotion-marks", fromYearId, selectedClass, studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      // Get assessments for this year
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("academic_year_id", fromYearId)
        .eq("school_id", schoolId);

      if (!assessments || assessments.length === 0) return [];

      const assessmentIds = assessments.map((a) => a.id);

      const { data: marks, error } = await supabase
        .from("student_marks")
        .select("student_id, marks_obtained, max_marks, grade, subject_id, subjects(name)")
        .in("student_id", studentIds)
        .in("assessment_id", assessmentIds);

      if (error) throw error;
      return marks as Array<{
        student_id: string;
        marks_obtained: number;
        max_marks: number;
        grade: string | null;
        subject_id: string;
        subjects: { name: string };
      }>;
    },
    enabled: studentIds.length > 0 && !!fromYearId,
  });

  // Fetch grade mappings for the class template to determine fail threshold
  const { data: failGrades } = useQuery({
    queryKey: ["fail-grades", fromYearId, selectedClass, schoolId],
    queryFn: async () => {
      // Find the template assigned to this class
      const { data: assignment } = await supabase
        .from("class_template_assignments")
        .select("template_id")
        .eq("school_id", schoolId)
        .eq("academic_year_id", fromYearId)
        .eq("class_name", selectedClass)
        .maybeSingle();

      if (!assignment) {
        // Default: D and E are failing grades
        return new Set(["D", "E"]);
      }

      const { data: mappings } = await supabase
        .from("template_grade_mappings")
        .select("grade_label, min_percentage")
        .eq("template_id", assignment.template_id)
        .order("min_percentage", { ascending: true });

      if (!mappings || mappings.length === 0) return new Set(["D", "E"]);

      // Bottom 2 grades or grades below 33% are considered failing
      const failing = mappings.filter((m) => m.min_percentage < 33).map((m) => m.grade_label);
      return new Set(failing.length > 0 ? failing : [mappings[0].grade_label]);
    },
    enabled: !!selectedClass && !!fromYearId,
  });

  // Check existing enrollments in target year
  const { data: existingTargetEnrollments } = useQuery({
    queryKey: ["existing-enrollments", toYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("academic_year_id", toYearId);
      if (error) throw error;
      return new Set((data ?? []).map((d) => d.student_id));
    },
    enabled: !!toYearId,
  });

  // Build rows with auto-suggestion
  const rows = useMemo<EnrollmentRow[]>(() => {
    if (!classEnrollments.length) return [];

    // Build per-student marks summary
    const studentMarksMap = new Map<string, { avgPct: number; failingSubs: string[] }>();
    if (marksData) {
      const grouped = new Map<string, typeof marksData>();
      for (const m of marksData) {
        if (!grouped.has(m.student_id)) grouped.set(m.student_id, []);
        grouped.get(m.student_id)!.push(m);
      }
      for (const [sid, marks] of grouped) {
        const totalPct = marks.reduce((s, m) => s + (m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0), 0);
        const avgPct = marks.length > 0 ? totalPct / marks.length : 0;
        const failingSubs = marks
          .filter((m) => {
            if (m.grade && failGrades?.has(m.grade)) return true;
            if (m.max_marks > 0 && (m.marks_obtained / m.max_marks) * 100 < 33) return true;
            return false;
          })
          .map((m) => m.subjects?.name ?? "Unknown");
        studentMarksMap.set(sid, { avgPct, failingSubs: [...new Set(failingSubs)] });
      }
    }

    return classEnrollments
      .map((e) => {
        const status = getPromotionStatus(e.class_name);
        const promotedClass = getNextClass(e.class_name);
        const marksInfo = studentMarksMap.get(e.student_id);
        const hasMarks = !!marksInfo && marksData && marksData.some((m) => m.student_id === e.student_id);

        let autoSuggestion: PromotionAction = "promote";
        if (status === "passed_out") {
          autoSuggestion = "exclude";
        } else if (hasMarks && marksInfo && marksInfo.failingSubs.length > 0) {
          autoSuggestion = "retain";
        }

        const override = overrides[e.student_id];

        return {
          enrollment_id: e.id,
          student_id: e.student_id,
          student_name: e.students.name,
          current_class: e.class_name,
          section: e.section,
          promoted_class: promotedClass,
          action: override?.action ?? autoSuggestion,
          autoSuggestion,
          avgPercentage: marksInfo?.avgPct ?? null,
          failingSubjects: marksInfo?.failingSubs ?? [],
        };
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [classEnrollments, overrides, marksData, failGrades]);

  // Filter already-enrolled
  const promotableRows = useMemo(() => {
    if (!existingTargetEnrollments) return rows;
    return rows.filter((r) => !existingTargetEnrollments.has(r.student_id));
  }, [rows, existingTargetEnrollments]);

  const alreadyEnrolledCount = rows.length - promotableRows.length;
  const activeRows = promotableRows.filter((r) => r.action !== "exclude");
  const promoteCount = promotableRows.filter((r) => r.action === "promote").length;
  const retainCount = promotableRows.filter((r) => r.action === "retain").length;
  const excludeCount = promotableRows.filter((r) => r.action === "exclude").length;

  const setAction = (studentId: string, action: PromotionAction) => {
    setOverrides((prev) => ({ ...prev, [studentId]: { action } }));
  };

  // Promote mutation
  const promoteMutation = useMutation({
    mutationFn: async () => {
      const toInsert = activeRows
        .filter((r) => r.promoted_class || r.action === "retain")
        .map((r) => ({
          student_id: r.student_id,
          academic_year_id: toYearId,
          class_name: r.action === "retain" ? r.current_class : r.promoted_class,
          section: r.section,
        }));

      if (toInsert.length === 0) throw new Error("No students to promote");

      const { error: insertError } = await supabase.from("student_enrollments").insert(toInsert);
      if (insertError) throw insertError;

      const promoted = activeRows.filter((r) => r.action === "promote" && r.promoted_class);
      for (const row of promoted) {
        const { error } = await supabase
          .from("students")
          .update({ class_name: row.promoted_class, section: row.section })
          .eq("id", row.student_id);
        if (error) console.error("Failed to update student class:", error);
      }
    },
    onSuccess: () => {
      toast.success(`${activeRows.length} students processed for ${selectedClass}`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments-for-promotion"] });
      queryClient.invalidateQueries({ queryKey: ["existing-enrollments"] });
      setOverrides({});
    },
    onError: (error: any) => {
      toast.error("Promotion failed", { description: error.message });
    },
  });

  const fromYear = academicYears.find((y) => y.id === fromYearId);
  const toYear = academicYears.find((y) => y.id === toYearId);

  if (academicYears.length < 2) {
    return (
      <Card>
        <EmptyState
          icon={GraduationCap}
          title="Need at least 2 academic years"
          description="Create a target academic year before promoting students"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year & Class selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>From Academic Year</Label>
              <Select value={fromYearId} onValueChange={handleFromChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source year" />
                </SelectTrigger>
                <SelectContent>
                  {sortedYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Academic Year</Label>
              <Select value={toYearId} onValueChange={handleToChange} disabled={!fromYearId}>
                <SelectTrigger>
                  <SelectValue placeholder={fromYearId ? "Select target year" : "Select source first"} />
                </SelectTrigger>
                <SelectContent>
                  {toYearOptions.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={selectedClass}
                onValueChange={(v) => { setSelectedClass(v); setOverrides({}); }}
                disabled={!fromYearId || !toYearId || enrollmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={enrollmentsLoading ? "Loading..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student table */}
      {fromYearId && toYearId && selectedClass && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {selectedClass} → {getNextClass(selectedClass) ?? "Passed Out"}
                </CardTitle>
                <CardDescription>
                  Review and confirm promotions. Suggestions are based on grade mappings.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="secondary">{promotableRows.length} students</Badge>
                <Badge className="bg-status-paid/20 text-status-paid border-status-paid/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />{promoteCount} promote
                </Badge>
                {retainCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />{retainCount} retain
                  </Badge>
                )}
                {excludeCount > 0 && (
                  <Badge variant="outline">
                    <XCircle className="h-3 w-3 mr-1" />{excludeCount} exclude
                  </Badge>
                )}
                {alreadyEnrolledCount > 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {alreadyEnrolledCount} already in {toYear?.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : promotableRows.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title={alreadyEnrolledCount > 0
                  ? `All students already enrolled in ${toYear?.name}`
                  : `No students found in ${selectedClass}`}
                description="Select a different class or academic year"
              />
            ) : (
              <>
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Avg %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Promoted To</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TooltipProvider>
                        {promotableRows.map((row) => (
                          <TableRow key={row.student_id} className={row.action === "exclude" ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{row.student_name}</TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{row.section ?? "—"}</span>
                            </TableCell>
                            <TableCell>
                              {row.avgPercentage !== null ? (
                                <span className={`text-sm font-medium ${row.avgPercentage < 33 ? "text-destructive" : row.avgPercentage < 50 ? "text-amber-600" : "text-status-paid"}`}>
                                  {row.avgPercentage.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">No marks</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.failingSubjects.length > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs cursor-help">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {row.failingSubjects.length} failing
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium mb-1">Failing subjects:</p>
                                    <ul className="text-xs">
                                      {row.failingSubjects.map((s) => <li key={s}>• {s}</li>)}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              ) : row.avgPercentage !== null ? (
                                <Badge variant="outline" className="bg-status-paid/10 text-status-paid border-status-paid/20 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Pass
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.action !== "exclude" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              {row.action === "exclude" ? (
                                <span className="text-muted-foreground text-sm">—</span>
                              ) : row.action === "retain" ? (
                                <span className="text-amber-600 text-sm font-medium">{row.current_class} (Retain)</span>
                              ) : (
                                <span className="text-sm font-medium text-primary">{row.promoted_class ?? "N/A"}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant={row.action === "promote" ? "default" : "ghost"}
                                      className="h-7 px-2 text-xs"
                                      onClick={() => setAction(row.student_id, "promote")}
                                      disabled={!row.promoted_class}
                                    >
                                      Promote
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Promote to {row.promoted_class}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant={row.action === "retain" ? "secondary" : "ghost"}
                                      className="h-7 px-2 text-xs"
                                      onClick={() => setAction(row.student_id, "retain")}
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Retain in {row.current_class}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant={row.action === "exclude" ? "destructive" : "ghost"}
                                      className="h-7 px-2 text-xs"
                                      onClick={() => setAction(row.student_id, "exclude")}
                                    >
                                      <UserMinus className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Exclude from promotion</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TooltipProvider>
                    </TableBody>
                  </Table>
                </div>

                {/* Info banner about auto-suggestions */}
                {marksData && marksData.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Suggestions are auto-generated based on grade mappings. Students with failing grades (below 33% or lowest grade tier) are suggested for retention.
                      You can override any suggestion using the action buttons.
                    </span>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => promoteMutation.mutate()}
                    disabled={promoteMutation.isPending || activeRows.length === 0}
                    size="lg"
                  >
                    {promoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm {activeRows.length} Students
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
