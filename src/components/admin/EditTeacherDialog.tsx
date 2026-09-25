import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTeachers, type Teacher } from "@/hooks/useTeachers";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, User, BookOpen, ChevronRight, IdCard, CalendarDays, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortClassNames } from "@/lib/class-sort";
import { useCurrentAcademicYearContext } from "@/hooks/useAcademicYears";

interface EditTeacherDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const { updateTeacher } = useTeachers();
  const currentYear = useCurrentAcademicYearContext();
  const { assignments, yearlessCount, isLoading: loadingSubjectAssignments, updateAssignments } = useTeacherSubjects(teacher?.id, currentYear.academic_year_id);
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  // Set of "subjectId::className" keys
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (teacher) {
      setEditName(teacher.name);
      setEditEmail(teacher.email);
      setEditEmployeeId(teacher.employee_id ?? "");
    }
  }, [teacher]);

  useEffect(() => {
    const pairs = new Set(assignments.map(a => `${a.subject_id}::${a.class_name}`));
    setSelectedPairs(pairs);
    // Auto-expand subjects that have assignments
    const subjectIds = new Set(assignments.map(a => a.subject_id));
    setExpandedSubjects(subjectIds);
  }, [assignments]);

  const handleSave = async () => {
    if (!teacher || !editName.trim() || !editEmail.trim()) return;

    try {
      await updateTeacher.mutateAsync({
        id: teacher.id,
        name: editName.trim(),
        is_active: teacher.is_active,
        employee_id: editEmployeeId.trim() || null,
      });
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.toLowerCase().includes('duplicate')) {
        toast.error("That Employee ID is already used by another user in this school");
      }
      return;
    }

    if (editEmail.trim() !== teacher.email) {
      const { error } = await supabase
        .from('school_teachers')
        .update({ email: editEmail.trim() })
        .eq('id', teacher.id);
      if (error) toast.error("Failed to update email");
    }

    if (currentYear.academic_year_id) {
      const assignmentPairs = Array.from(selectedPairs).map(key => {
        const [subject_id, class_name] = key.split('::');
        return { subject_id, class_name };
      });
      await updateAssignments.mutateAsync({
        teacherId: teacher.id,
        academicYearId: currentYear.academic_year_id,
        assignments: assignmentPairs,
      });
    } else {
      toast.warning("Subject assignments were not saved", { description: "Set a single current academic year first." });
    }

    onOpenChange(false);
  };

  const handleSendPasswordReset = async () => {
    if (!teacher) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(teacher.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent!", { description: `Sent to ${teacher.email}` });
    } catch (err: any) {
      toast.error("Failed to send reset link", { description: err.message });
    } finally {
      setSendingReset(false);
    }
  };

  const toggleSubjectClass = (subjectId: string, className: string) => {
    const key = `${subjectId}::${className}`;
    setSelectedPairs(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllClassesForSubject = (subjectId: string, classes: string[]) => {
    setSelectedPairs(prev => {
      const next = new Set(prev);
      const allSelected = classes.every(cn => next.has(`${subjectId}::${cn}`));
      classes.forEach(cn => {
        const key = `${subjectId}::${cn}`;
        if (allSelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
    // Auto-expand
    setExpandedSubjects(prev => new Set(prev).add(subjectId));
  };

  const toggleExpanded = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) next.delete(subjectId);
      else next.add(subjectId);
      return next;
    });
  };

  const getSubjectClassCount = (subjectId: string, classes: string[]) => {
    return classes.filter(cn => selectedPairs.has(`${subjectId}::${cn}`)).length;
  };

  const isLoading = loadingSubjectAssignments || loadingSubjects;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 py-4">
          <div className="space-y-2">
            <Label><User className="h-4 w-4 inline mr-1" />Full Name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Teacher's name" />
          </div>

          <div className="space-y-2">
            <Label><Mail className="h-4 w-4 inline mr-1" />Email Address</Label>
            <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="teacher@school.com" />
          </div>

          <div className="space-y-2">
            <Label><IdCard className="h-4 w-4 inline mr-1" />Employee ID</Label>
            <Input value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)} placeholder="e.g. EMP-001" maxLength={40} />
            <p className="text-xs text-muted-foreground">Optional. Must be unique within your school.</p>
          </div>

          {/* Subject-Class Assignments */}
          <div className="space-y-2">
            <Label><BookOpen className="h-4 w-4 inline mr-1" />Assigned Subjects &amp; Classes</Label>
            {currentYear.name && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>Academic Year: <span className="font-medium">{currentYear.name.replace('-', '–')}</span> (Current)</span>
              </div>
            )}
            {currentYear.warning && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{currentYear.warning}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Assign the subjects and classes this teacher is qualified to teach for the current academic year. The timetable will automatically use these assignments when scheduling lessons.
            </p>
            {yearlessCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {yearlessCount} older assignment{yearlessCount === 1 ? "" : "s"} without an academic year {yearlessCount === 1 ? "is" : "are"} kept unchanged and not shown here.
              </p>
            )}
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects created yet.</p>
            ) : (
              <div className="border rounded-md p-2 max-h-64 overflow-y-auto space-y-1">
                {subjects.map((subject) => {
                  const sortedClasses = sortClassNames(subject.assigned_classes);
                  const selectedCount = getSubjectClassCount(subject.id, sortedClasses);
                  const allSelected = sortedClasses.length > 0 && selectedCount === sortedClasses.length;
                  const isExpanded = expandedSubjects.has(subject.id);

                  return (
                    <div key={subject.id} className="rounded-md border bg-card">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleAllClassesForSubject(subject.id, sortedClasses)}
                          disabled={sortedClasses.length === 0}
                        />
                        <button
                          type="button"
                          className="flex-1 flex items-center gap-2 text-left"
                          onClick={() => toggleExpanded(subject.id)}
                        >
                          <ChevronRight className={cn("h-4 w-4 transition-transform text-muted-foreground", isExpanded && "rotate-90")} />
                          <span className="text-sm font-medium">{subject.name}</span>
                          {selectedCount > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {selectedCount}/{sortedClasses.length} classes
                            </span>
                          )}
                        </button>
                      </div>
                      {isExpanded && sortedClasses.length > 0 && (
                        <div className="pl-10 pr-3 pb-2 space-y-1">
                          {sortedClasses.map(cn => (
                            <label key={cn} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-0.5">
                              <Checkbox
                                checked={selectedPairs.has(`${subject.id}::${cn}`)}
                                onCheckedChange={() => toggleSubjectClass(subject.id, cn)}
                              />
                              <span className="text-sm text-muted-foreground">{cn}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {isExpanded && sortedClasses.length === 0 && (
                        <p className="pl-10 pr-3 pb-2 text-xs text-muted-foreground">No classes assigned to this subject.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Password Reset */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-muted-foreground text-sm font-medium">Password Reset</Label>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">Send Password Reset Link</p>
                <p className="text-xs text-muted-foreground">Sends a reset email to {teacher?.email || "the teacher"}.</p>
              </div>
              <Button
                type="button" variant="outline" size="sm" className="gap-1.5 shrink-0"
                disabled={sendingReset || !teacher} onClick={handleSendPasswordReset}
              >
                {sendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Email Reset Link
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTeacher.isPending || updateAssignments.isPending}>
            {(updateTeacher.isPending || updateAssignments.isPending) ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
