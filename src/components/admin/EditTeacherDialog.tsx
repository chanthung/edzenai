import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeachers, type Teacher } from "@/hooks/useTeachers";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useTeacherClasses, type TeacherClassAssignment } from "@/hooks/useTeacherClasses";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, User, BookOpen, School } from "lucide-react";

interface EditTeacherDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const { updateTeacher } = useTeachers();
  const { assignedSubjectIds, isLoading: loadingSubjectAssignments, updateAssignments } = useTeacherSubjects(teacher?.id);
  const { assignedClasses, isLoading: loadingClassAssignments, updateAssignments: updateClassAssignments } = useTeacherClasses(teacher?.id);
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();
  const { data: allStudents = [] } = useResolvedStudents();

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClassSections, setSelectedClassSections] = useState<Set<string>>(new Set());
  const [sendingReset, setSendingReset] = useState(false);

  // Derive available class-section combos
  const classSectionOptions = useMemo(() => {
    const map = new Map<string, Set<string>>();
    allStudents.forEach(s => {
      if (s.class_name) {
        if (!map.has(s.class_name)) map.set(s.class_name, new Set());
        if (s.section) map.get(s.class_name)!.add(s.section);
      }
    });
    const result: { class_name: string; section: string | null; key: string }[] = [];
    const sortedClasses = Array.from(map.keys()).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB || a.localeCompare(b);
    });
    for (const cls of sortedClasses) {
      const sections = Array.from(map.get(cls)!).sort();
      if (sections.length === 0) {
        result.push({ class_name: cls, section: null, key: `${cls}::` });
      } else {
        for (const sec of sections) {
          result.push({ class_name: cls, section: sec, key: `${cls}::${sec}` });
        }
      }
    }
    return result;
  }, [allStudents]);

  useEffect(() => {
    if (teacher) {
      setEditName(teacher.name);
      setEditEmail(teacher.email);
    }
  }, [teacher]);

  useEffect(() => {
    setSelectedSubjects(assignedSubjectIds);
  }, [assignedSubjectIds]);

  useEffect(() => {
    const set = new Set<string>();
    assignedClasses.forEach(a => set.add(`${a.class_name}::${a.section || ''}`));
    setSelectedClassSections(set);
  }, [assignedClasses]);

  const handleSave = async () => {
    if (!teacher || !editName.trim() || !editEmail.trim()) return;

    await updateTeacher.mutateAsync({
      id: teacher.id,
      name: editName.trim(),
      is_active: teacher.is_active,
    });

    if (editEmail.trim() !== teacher.email) {
      const { error } = await supabase
        .from('school_teachers')
        .update({ email: editEmail.trim() })
        .eq('id', teacher.id);
      if (error) toast.error("Failed to update email");
    }

    await updateAssignments.mutateAsync({
      teacherId: teacher.id,
      subjectIds: selectedSubjects,
    });

    const classAssignments: TeacherClassAssignment[] = Array.from(selectedClassSections).map(key => {
      const [cls, sec] = key.split('::');
      return { class_name: cls, section: sec || null };
    });
    await updateClassAssignments.mutateAsync({
      teacherId: teacher.id,
      assignments: classAssignments,
    });

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

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const toggleClassSection = (key: string) => {
    setSelectedClassSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isLoading = loadingSubjectAssignments || loadingSubjects || loadingClassAssignments;

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

          {/* Class/Section Assignments */}
          <div className="space-y-2">
            <Label><School className="h-4 w-4 inline mr-1" />Assigned Classes & Sections</Label>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : classSectionOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes found. Add students first.</p>
            ) : (
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {classSectionOptions.map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                    <Checkbox
                      checked={selectedClassSections.has(opt.key)}
                      onCheckedChange={() => toggleClassSection(opt.key)}
                    />
                    <span className="text-sm">Class {opt.class_name}{opt.section ? ` - Section ${opt.section}` : ''}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Subject Assignments */}
          <div className="space-y-2">
            <Label><BookOpen className="h-4 w-4 inline mr-1" />Assigned Subjects</Label>
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects created yet.</p>
            ) : (
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {subjects.map((subject) => (
                  <label key={subject.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                    <Checkbox
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => toggleSubject(subject.id)}
                    />
                    <span className="text-sm">{subject.name}</span>
                    {subject.assigned_classes.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">{subject.assigned_classes.join(", ")}</span>
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
