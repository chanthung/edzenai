import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PasswordInput } from "@/components/ui/password-input";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeacherSubjects } from "@/hooks/useTeacherSubjects";
import { useTeacherClasses, type TeacherClassAssignment } from "@/hooks/useTeacherClasses";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { EditTeacherDialog } from "@/components/admin/EditTeacherDialog";
import { Plus, UserPlus, Mail, User, Pencil, BookOpen, School } from "lucide-react";
import { toast } from "sonner";

export default function Teachers() {
  const { teachers, isLoading, createTeacher, updateTeacher } = useTeachers();
  const { isRestricted } = useSubscriptionStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [addSelectedSubjects, setAddSelectedSubjects] = useState<string[]>([]);
  const [addSelectedClassSections, setAddSelectedClassSections] = useState<Set<string>>(new Set());

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();
  const { data: allStudents = [] } = useResolvedStudents();
  const { updateAssignments } = useTeacherSubjects();
  const { updateAssignments: updateClassAssignments } = useTeacherClasses();

  // Derive class-section combos
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<typeof teachers[0] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const result = await createTeacher.mutateAsync({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    // After creation, assign subjects and classes if any selected
    const newTeacherId = result?.teacherId;
    if (newTeacherId) {
      if (addSelectedSubjects.length > 0) {
        await updateAssignments.mutateAsync({ teacherId: newTeacherId, subjectIds: addSelectedSubjects });
      }
      if (addSelectedClassSections.size > 0) {
        const assignments: TeacherClassAssignment[] = Array.from(addSelectedClassSections).map(key => {
          const [cls, sec] = key.split('::');
          return { class_name: cls, section: sec || null };
        });
        await updateClassAssignments.mutateAsync({ teacherId: newTeacherId, assignments });
      }
    }

    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setAddSelectedSubjects([]);
    setAddSelectedClassSections(new Set());
    setDialogOpen(false);
  };

  const handleToggleActive = async (teacher: { id: string; name: string; is_active: boolean }) => {
    await updateTeacher.mutateAsync({ id: teacher.id, name: teacher.name, is_active: !teacher.is_active });
  };

  const handleEditTeacher = (teacher: typeof teachers[0]) => {
    setEditingTeacher(teacher);
    setEditDialogOpen(true);
  };

  const toggleAddSubject = (id: string) => {
    setAddSelectedSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAddClassSection = (key: string) => {
    setAddSelectedClassSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <AdminLayout>
      <PageHeader title="Teachers" description="Manage teacher accounts for Student Progress module">
        <RestrictedButton isRestricted={isRestricted}>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isRestricted}><Plus className="h-4 w-4 mr-2" />Add Teacher</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader><DialogTitle>Add New Teacher</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Enter teacher's name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="teacher@school.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" placeholder="Create a password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput id="confirmPassword" placeholder="Confirm password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required minLength={6} />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters. Share this password with the teacher securely.</p>
                </div>

                {/* Class/Section Assignments */}
                <div className="space-y-2">
                  <Label><School className="h-4 w-4 inline mr-1" />Assign Classes & Sections</Label>
                  {classSectionOptions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No classes found.</p>
                  ) : (
                    <div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
                      {classSectionOptions.map(opt => (
                        <label key={opt.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                          <Checkbox checked={addSelectedClassSections.has(opt.key)} onCheckedChange={() => toggleAddClassSection(opt.key)} />
                          <span className="text-sm">Class {opt.class_name}{opt.section ? ` - Sec ${opt.section}` : ''}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject Assignments */}
                <div className="space-y-2">
                  <Label><BookOpen className="h-4 w-4 inline mr-1" />Assign Subjects</Label>
                  {loadingSubjects ? (
                    <Skeleton className="h-16 w-full" />
                  ) : subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No subjects created yet.</p>
                  ) : (
                    <div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
                      {subjects.map(subject => (
                        <label key={subject.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                          <Checkbox checked={addSelectedSubjects.includes(subject.id)} onCheckedChange={() => toggleAddSubject(subject.id)} />
                          <span className="text-sm">{subject.name}</span>
                          {subject.assigned_classes.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto">{subject.assigned_classes.join(", ")}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createTeacher.isPending}>
                    {createTeacher.isPending ? "Creating..." : "Create Teacher"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </RestrictedButton>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>Teacher Accounts</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState icon={UserPlus} title="No teachers yet" description="Add teachers to allow them to manage student progress and marks." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.is_active ? "default" : "secondary"}>
                        {teacher.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTeacher(teacher)} disabled={isRestricted}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch checked={teacher.is_active} onCheckedChange={() => handleToggleActive(teacher)} disabled={updateTeacher.isPending || isRestricted} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditTeacherDialog
        teacher={editingTeacher}
        open={editDialogOpen}
        onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingTeacher(null); }}
      />

      <Card className="mt-6">
        <CardHeader><CardTitle>About Teacher Accounts</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Teachers have restricted access to only the <strong>Student Progress</strong> module.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Can view and manage subjects</li>
            <li>Can create and manage assessments</li>
            <li>Can enter and update student marks</li>
            <li>Can view student progress reports</li>
            <li>Can mark daily attendance for assigned classes</li>
          </ul>
          <p className="pt-2">Teachers <strong>cannot</strong> access fee management, student records, or school settings.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
