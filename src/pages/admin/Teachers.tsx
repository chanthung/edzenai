import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { RestrictedButton } from "@/components/admin/RestrictedOverlay";
import { Plus, UserPlus, Mail, User, Eye, EyeOff, Pencil } from "lucide-react";

export default function Teachers() {
  const { teachers, isLoading, createTeacher, updateTeacher } = useTeachers();
  const { isRestricted } = useSubscriptionStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Edit teacher state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<{ id: string; name: string; is_active: boolean } | null>(null);
  const [editName, setEditName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) return;
    
    await createTeacher.mutateAsync(formData);
    setFormData({ name: "", email: "", password: "" });
    setDialogOpen(false);
  };

  const handleToggleActive = async (teacher: { id: string; name: string; is_active: boolean }) => {
    await updateTeacher.mutateAsync({
      id: teacher.id,
      name: teacher.name,
      is_active: !teacher.is_active,
    });
  };

  const handleEditTeacher = (teacher: { id: string; name: string; is_active: boolean }) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher || !editName.trim()) return;
    await updateTeacher.mutateAsync({
      id: editingTeacher.id,
      name: editName.trim(),
      is_active: editingTeacher.is_active,
    });
    setEditDialogOpen(false);
    setEditingTeacher(null);
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditingTeacher(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Teacher's name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTeacher} disabled={updateTeacher.isPending}>
              {updateTeacher.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
