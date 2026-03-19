import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getNextClass, getPromotionStatus } from "@/lib/grade-promotion";
import type { AcademicYear } from "@/hooks/useAcademicYears";
import { ArrowRight, Loader2, GraduationCap, UserMinus, RotateCcw } from "lucide-react";

type PromotionAction = "promote" | "retain" | "exclude";

interface EnrollmentRow {
  enrollment_id: string;
  student_id: string;
  student_name: string;
  current_class: string | null;
  section: string | null;
  promoted_class: string | null;
  action: PromotionAction;
}

interface PromoteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYears: AcademicYear[];
  schoolId: string;
}

export function PromoteStudentsDialog({ open, onOpenChange, academicYears, schoolId }: PromoteStudentsDialogProps) {
  const queryClient = useQueryClient();
  const [fromYearId, setFromYearId] = useState("");
  const [toYearId, setToYearId] = useState("");
  const [overrides, setOverrides] = useState<Record<string, { action: PromotionAction; targetClass?: string }>>({});

  // Sort academic years by start_date ascending for proper ordering
  const sortedYears = useMemo(() => 
    [...academicYears].sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [academicYears]
  );

  // "To" options: only years that come after the selected "From" year
  const toYearOptions = useMemo(() => {
    if (!fromYearId) return [];
    const fromIdx = sortedYears.findIndex((y) => y.id === fromYearId);
    return fromIdx >= 0 ? sortedYears.slice(fromIdx + 1) : [];
  }, [sortedYears, fromYearId]);

  // Reset toYearId if it's no longer valid when From changes
  const handleFromChange = (v: string) => {
    setFromYearId(v);
    setOverrides({});
    const fromIdx = sortedYears.findIndex((y) => y.id === v);
    const toIdx = sortedYears.findIndex((y) => y.id === toYearId);
    if (toIdx <= fromIdx) setToYearId("");
  };

  // Fetch enrollments for source year — filter by school_id on the server
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

  // Check existing enrollments in target year to avoid duplicates
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

  // Build rows
  const rows = useMemo<EnrollmentRow[]>(() => {
    if (!enrollments) return [];
    return enrollments
      .map((e) => {
        const status = getPromotionStatus(e.class_name);
        const promotedClass = getNextClass(e.class_name);
        const override = overrides[e.student_id];
        const defaultAction: PromotionAction = status === "passed_out" ? "exclude" : "promote";

        return {
          enrollment_id: e.id,
          student_id: e.student_id,
          student_name: e.students.name,
          current_class: e.class_name,
          section: e.section,
          promoted_class: override?.targetClass ?? promotedClass,
          action: override?.action ?? defaultAction,
        };
      })
      .sort((a, b) => (a.current_class ?? "").localeCompare(b.current_class ?? "") || a.student_name.localeCompare(b.student_name));
  }, [enrollments, overrides]);

  // Filter out already-enrolled students
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
    setOverrides((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], action },
    }));
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

      // Batch insert enrollments
      const { error: insertError } = await supabase
        .from("student_enrollments")
        .insert(toInsert);

      if (insertError) throw insertError;

      // Update students.class_name for promoted students
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
      toast.success(`${activeRows.length} students promoted successfully`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments-for-promotion"] });
      queryClient.invalidateQueries({ queryKey: ["existing-enrollments"] });
      onOpenChange(false);
      setFromYearId("");
      setToYearId("");
      setOverrides({});
    },
    onError: (error: any) => {
      toast.error("Promotion failed", { description: error.message });
    },
  });

  const fromYear = academicYears.find((y) => y.id === fromYearId);
  const toYear = academicYears.find((y) => y.id === toYearId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Promote Students
          </DialogTitle>
          <DialogDescription>
            Move students from one academic year to the next with automatic class promotion
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Academic Year</Label>
            <Select value={fromYearId} onValueChange={(v) => { setFromYearId(v); setOverrides({}); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select source year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id} disabled={y.id === toYearId}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To Academic Year</Label>
            <Select value={toYearId} onValueChange={setToYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id} disabled={y.id === fromYearId}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {fromYearId && toYearId && (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{promotableRows.length} students</Badge>
              <Badge className="bg-status-paid/20 text-status-paid border-status-paid/20">{promoteCount} promote</Badge>
              {retainCount > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">{retainCount} retain</Badge>
              )}
              {excludeCount > 0 && (
                <Badge variant="outline">{excludeCount} exclude</Badge>
              )}
              {alreadyEnrolledCount > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {alreadyEnrolledCount} already in {toYear?.name}
                </Badge>
              )}
            </div>

            {/* Student table */}
            <ScrollArea className="flex-1 min-h-0 border rounded-md">
              {enrollmentsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : promotableRows.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {alreadyEnrolledCount > 0
                    ? `All ${alreadyEnrolledCount} students are already enrolled in ${toYear?.name}`
                    : `No enrollments found in ${fromYear?.name}`}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Promoted To</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotableRows.map((row) => (
                      <TableRow key={row.student_id} className={row.action === "exclude" ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{row.student_name}</TableCell>
                        <TableCell>
                          <span className="text-sm">{row.current_class ?? "—"}</span>
                          {row.section && <span className="text-muted-foreground text-xs ml-1">({row.section})</span>}
                        </TableCell>
                        <TableCell>
                          {row.action !== "exclude" && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          {row.action === "exclude" ? (
                            <span className="text-muted-foreground text-sm">—</span>
                          ) : row.action === "retain" ? (
                            <span className="text-amber-600 text-sm">{row.current_class}</span>
                          ) : (
                            <span className="text-sm font-medium text-primary">{row.promoted_class ?? "N/A"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant={row.action === "promote" ? "default" : "ghost"}
                              className="h-7 px-2 text-xs"
                              onClick={() => setAction(row.student_id, "promote")}
                              disabled={!row.promoted_class}
                            >
                              Promote
                            </Button>
                            <Button
                              size="sm"
                              variant={row.action === "retain" ? "secondary" : "ghost"}
                              className="h-7 px-2 text-xs"
                              onClick={() => setAction(row.student_id, "retain")}
                              title="Keep in same class"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant={row.action === "exclude" ? "destructive" : "ghost"}
                              className="h-7 px-2 text-xs"
                              onClick={() => setAction(row.student_id, "exclude")}
                              title="Skip this student"
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => promoteMutation.mutate()}
            disabled={promoteMutation.isPending || activeRows.length === 0 || !fromYearId || !toYearId}
          >
            {promoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Promote {activeRows.length} Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
