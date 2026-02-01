import { useState } from "react";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from "@/hooks/progress/useSubjects";
import { BookOpen, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Subjects() {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; code: string } | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleOpenDialog = (subject?: { id: string; name: string; code: string | null }) => {
    if (subject) {
      setEditingSubject({ id: subject.id, name: subject.name, code: subject.code || "" });
      setName(subject.name);
      setCode(subject.code || "");
    } else {
      setEditingSubject(null);
      setName("");
      setCode("");
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({ id: editingSubject.id, name: name.trim(), code: code.trim() || undefined });
      } else {
        await createSubject.mutateAsync({ name: name.trim(), code: code.trim() || undefined });
      }
      setIsDialogOpen(false);
      setName("");
      setCode("");
      setEditingSubject(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject? This will also delete all marks associated with it.")) {
      try {
        await deleteSubject.mutateAsync(id);
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  return (
    <ProgressLayout>
      <PageHeader
        title="Subjects"
        description="Manage the subjects for student progress tracking"
      />

      <div className="mt-6">
        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
                  <DialogDescription>
                    {editingSubject
                      ? "Update the subject details below."
                      : "Enter the details for the new subject."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Subject Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Subject Code</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g., MATH"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSubject.isPending || updateSubject.isPending}>
                    {(createSubject.isPending || updateSubject.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingSubject ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subjects List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No subjects yet"
                description="Add subjects to start tracking student progress."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell className="text-muted-foreground">{subject.code || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subject.id)}
                            disabled={deleteSubject.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
