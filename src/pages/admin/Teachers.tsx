import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PasswordInput } from "@/components/ui/password-input";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { EditTeacherDialog } from "@/components/admin/EditTeacherDialog";
import { Plus, UserPlus, Mail, User, Pencil } from "lucide-react";
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

  // Edit teacher state
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
    
    await createTeacher.mutateAsync({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    setDialogOpen(false);
  };

  const handleToggleActive = async (teacher: { id: string; name: string; is_active: boolean }) => {
    await updateTeacher.mutateAsync({
      id: teacher.id,
      name: teacher.name,
      is_active: !teacher.is_active,
    });
  };

  const handleEditTeacher = (teacher: typeof teachers[0]) => {
    setEditingTeacher(teacher);
    setEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Teachers"
        description="Manage teacher accounts for Student Progress module"
      >
        <RestrictedButton isRestricted={isRestricted}>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isRestricted}>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter teacher's name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="teacher@school.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters. Share this password with the teacher securely.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
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
        <CardHeader>
          <CardTitle>Teacher Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No teachers yet"
              description="Add teachers to allow them to manage student progress and marks."
            />
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
                    <TableCell>
                      {new Date(teacher.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTeacher(teacher)}
                          disabled={isRestricted}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={teacher.is_active}
                          onCheckedChange={() => handleToggleActive(teacher)}
                          disabled={updateTeacher.isPending || isRestricted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <EditTeacherDialog
        teacher={editingTeacher}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingTeacher(null);
        }}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Teacher Accounts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Teachers have restricted access to only the <strong>Student Progress</strong> module.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Can view and manage subjects</li>
            <li>Can create and manage assessments</li>
            <li>Can enter and update student marks</li>
            <li>Can view student progress reports</li>
          </ul>
          <p className="pt-2">
            Teachers <strong>cannot</strong> access fee management, student records, or school settings.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
