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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTeachers, type InviteAssignment } from "@/hooks/useTeachers";
import { useSubjectsWithClasses } from "@/hooks/progress/useSubjects";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { EditTeacherDialog } from "@/components/admin/EditTeacherDialog";
import { Plus, UserPlus, Mail, User, Pencil, BookOpen, School, Send, Phone, RefreshCw, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DeliveryMethod = 'email' | 'whatsapp' | 'both';

export default function Teachers() {
  const { teachers, invites, isLoading, inviteUser, updateTeacher, resendInvite, cancelInvite } = useTeachers();
  const { isRestricted } = useSubscriptionStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher" as "teacher" | "accountant",
    delivery: "email" as DeliveryMethod,
    phone: "",
  });
  const [addSelectedSubjects, setAddSelectedSubjects] = useState<string[]>([]);
  const [addSelectedClassSections, setAddSelectedClassSections] = useState<Set<string>>(new Set());

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjectsWithClasses();
  const { data: allStudents = [] } = useResolvedStudents();

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
      if (sections.length === 0) result.push({ class_name: cls, section: null, key: `${cls}::` });
      else for (const sec of sections) result.push({ class_name: cls, section: sec, key: `${cls}::${sec}` });
    }
    return result;
  }, [allStudents]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<typeof teachers[0] | null>(null);

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "teacher", delivery: "email", phone: "" });
    setAddSelectedSubjects([]);
    setAddSelectedClassSections(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    if ((formData.delivery === 'whatsapp' || formData.delivery === 'both') && !formData.phone.trim()) return;

    const assignments: InviteAssignment[] = [];
    if (formData.role === 'teacher') {
      // Subject-class assignments
      subjects
        .filter(s => addSelectedSubjects.includes(s.id))
        .forEach(s => s.assigned_classes.forEach(cn => {
          assignments.push({ type: 'subject', subject_id: s.id, class_name: cn });
        }));
      // Class assignments
      Array.from(addSelectedClassSections).forEach(key => {
        const [class_name, section] = key.split('::');
        assignments.push({ type: 'class', class_name, section: section || null });
      });
    }

    await inviteUser.mutateAsync({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      delivery_method: formData.delivery,
      phone: formData.phone.trim() || null,
      assignments,
    });

    resetForm();
    setDialogOpen(false);
  };

  const handleToggleActive = async (teacher: { id: string; name: string; is_active: boolean }) => {
    await updateTeacher.mutateAsync({ id: teacher.id, name: teacher.name, is_active: !teacher.is_active });
  };

  const handleEditTeacher = (teacher: typeof teachers[0]) => {
    setEditingTeacher(teacher);
    setEditDialogOpen(true);
  };

  const toggleAddSubject = (id: string) =>
    setAddSelectedSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAddClassSection = (key: string) => setAddSelectedClassSections(prev => {
    const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next;
  });

  const roleLabel = (role: string) => role === 'accountant' ? 'Accountant' : 'Teacher';
  const showPhone = formData.delivery === 'whatsapp' || formData.delivery === 'both';

  return (
    <AdminLayout>
      <PageHeader title="Users" description="Invite teachers and accountants — they'll set their own password">
        <RestrictedButton isRestricted={isRestricted}>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button disabled={isRestricted}><Plus className="h-4 w-4 mr-2" />Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.role === 'teacher'
                      ? "Teachers access Student Progress, marks, and attendance."
                      : "Accountants access fee management, payments, and student records."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Enter name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="user@school.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10" required />
                  </div>
                </div>

                {/* Delivery method */}
                <div className="space-y-2">
                  <Label>Send invite via</Label>
                  <ToggleGroup type="single" value={formData.delivery} onValueChange={(v) => v && setFormData({ ...formData, delivery: v as DeliveryMethod })} className="justify-start">
                    <ToggleGroupItem value="email" className="gap-2"><Mail className="h-4 w-4" />Email</ToggleGroupItem>
                    <ToggleGroupItem value="whatsapp" className="gap-2"><Phone className="h-4 w-4" />WhatsApp</ToggleGroupItem>
                    <ToggleGroupItem value="both" className="gap-2">Both</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {showPhone && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="10-digit mobile" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="pl-10" required={showPhone} />
                    </div>
                    <p className="text-xs text-muted-foreground">+91 will be added automatically for 10-digit numbers.</p>
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <>
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
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={inviteUser.isPending} className="gap-2">
                    <Send className="h-4 w-4" />
                    {inviteUser.isPending ? "Sending..." : "Send Invite"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </RestrictedButton>
      </PageHeader>

      {/* Pending invites */}
      {invites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" /> Pending Invites ({invites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent via</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map(inv => {
                  const expired = new Date(inv.expires_at) < new Date();
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <div>{inv.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Last sent {formatDistanceToNow(new Date(inv.last_sent_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={inv.role === 'accountant' ? 'border-amber-500 text-amber-700' : 'border-blue-500 text-blue-700'}>
                          {roleLabel(inv.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="secondary">Invited</Badge>
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">{inv.delivery_method}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => resendInvite.mutate(inv.id)} disabled={resendInvite.isPending}>
                            <RefreshCw className="h-3.5 w-3.5" /> Resend
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => cancelInvite.mutate(inv.id)} disabled={cancelInvite.isPending}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState icon={UserPlus} title="No active users yet" description="Invite teachers or accountants to help manage your school." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
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
                      <Badge variant="outline" className={teacher.role === 'accountant' ? 'border-amber-500 text-amber-700' : 'border-blue-500 text-blue-700'}>
                        {roleLabel(teacher.role)}
                      </Badge>
                    </TableCell>
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
        <CardHeader><CardTitle>About User Roles</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <div>
            <p className="font-medium text-foreground mb-1">Teacher</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access Student Progress module only</li>
              <li>Can view and manage subjects, assessments, and marks</li>
              <li>Can mark daily attendance for assigned classes</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Accountant</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access fee management, student list, and payments</li>
              <li>Can create/update fee structures and mark payments</li>
              <li>Can send WhatsApp reminders and view fee reports</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
