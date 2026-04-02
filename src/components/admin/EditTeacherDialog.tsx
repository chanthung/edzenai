import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeachers, type Teacher } from "@/hooks/useTeachers";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, User, BookOpen } from "lucide-react";

interface EditTeacherDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const { updateTeacher } = useTeachers();
  const { assignedSubjectIds, isLoading: loadingSubjectAssignments, updateAssignments } = useTeacherSubjects(teacher?.id);
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (teacher) {
      setEditName(teacher.name);
      setEditEmail(teacher.email);
    }
  }, [teacher]);

  useEffect(() => {
    setSelectedSubjects(assignedSubjectIds);
  }, [assignedSubjectIds]);

  const handleSave = async () => {
    if (!teacher || !editName.trim() || !editEmail.trim()) return;

    // Update teacher name/email
    await updateTeacher.mutateAsync({
      id: teacher.id,
      name: editName.trim(),
      is_active: teacher.is_active,
    });

    // Update email if changed (via direct update since the hook doesn't support it yet)
    if (editEmail.trim() !== teacher.email) {
      const { error } = await supabase
        .from('school_teachers')
        .update({ email: editEmail.trim() })
        .eq('id', teacher.id);
      if (error) {
        toast.error("Failed to update email");
      }
    }

    // Update subject assignments
    await updateAssignments.mutateAsync({
      teacherId: teacher.id,
      subjectIds: selectedSubjects,
    });

    onOpenChange(false);
  };

  const handleSendPasswordReset = async () => {
    if (!teacher) return;
    setSendingReset(true);
    try {
      // Use the teacher's email to send password reset
      const { error } = await supabase.auth.resetPasswordForEmail(teacher.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent!", {
        description: `Sent to ${teacher.email}`,
      });
    } catch (err: any) {
      toast.error("Failed to send reset link", { description: err.message });
    } finally {
      setSendingReset(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const isLoading = loadingSubjectAssignments || loadingSubjects;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label><User className="h-4 w-4 inline mr-1" />Full Name</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Teacher's name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label><Mail className="h-4 w-4 inline mr-1" />Email Address</Label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="teacher@school.com"
            />
          </div>

          {/* Subject Assignments */}
          <div className="space-y-2">
            <Label><BookOpen className="h-4 w-4 inline mr-1" />Assigned Subjects</Label>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects created yet. Add subjects in the Student Progress module first.</p>
            ) : (
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                  >
                    <Checkbox
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => toggleSubject(subject.id)}
                    />
                    <span className="text-sm">{subject.name}</span>
                    {subject.assigned_classes.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {subject.assigned_classes.join(", ")}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Password Reset */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-muted-foreground text-sm font-medium">Password Reset</Label>
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">Send Password Reset Link</p>
                <p className="text-xs text-muted-foreground">
                  Sends a reset email to {teacher?.email || "the teacher"}.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={sendingReset || !teacher}
                onClick={handleSendPasswordReset}
              >
                {sendingReset ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                Email Reset Link
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={updateTeacher.isPending || updateAssignments.isPending}
          >
            {(updateTeacher.isPending || updateAssignments.isPending) ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
