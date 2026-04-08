import { useState, useMemo } from "react";
import { sortClassNames } from "@/lib/class-sort";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSubjectsWithClasses,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  type SubjectType,
} from "@/hooks/progress/useSubjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Edit, Trash2, Loader2, Info } from "lucide-react";
import { CompetencyManager } from "@/components/progress/CompetencyManager";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SUBJECT_TYPES: { value: SubjectType; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "co_curricular", label: "Co-Curricular" },
  { value: "vocational", label: "Vocational" },
];

const SUBJECT_TYPE_COLORS: Record<SubjectType, string> = {
  academic: "default",
  co_curricular: "secondary",
  vocational: "outline",
};

function useUniqueClasses() {
  return useQuery({
    queryKey: ["unique-classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("class_name")
        .not("class_name", "is", null);
      if (error) throw error;
      const classes = [
        ...new Set((data || []).map((s) => s.class_name).filter(Boolean)),
      ] as string[];
      return sortClassNames(classes);
    },
  });
}

export default function Subjects() {
  const { data: subjects = [], isLoading } = useSubjectsWithClasses();
  const { data: uniqueClasses = [] } = useUniqueClasses();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{
    id: string;
    name: string;
    code: string;
    subject_type: SubjectType;
  } | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [subjectType, setSubjectType] = useState<SubjectType>("academic");

  // Check if a subject with this name already exists
  const existingMatch = useMemo(() => {
    if (!name.trim() || editingSubject) return false;
    return subjects.some(
      (s) =>
        s.name.toLowerCase() === name.trim().toLowerCase() &&
        s.subject_type === subjectType
    );
  }, [name, subjectType, subjects, editingSubject]);

  const handleOpenDialog = (
    subject?: {
      id: string;
      name: string;
      code: string | null;
      subject_type: SubjectType;
      assigned_classes: string[];
    }
  ) => {
    if (subject) {
      setEditingSubject({
        id: subject.id,
        name: subject.name,
        code: subject.code || "",
        subject_type: subject.subject_type || "academic",
      });
      setName(subject.name);
      setCode(subject.code || "");
      setSelectedClasses(subject.assigned_classes || []);
      setSubjectType(subject.subject_type || "academic");
    } else {
      setEditingSubject(null);
      setName("");
      setCode("");
      setSelectedClasses([]);
      setSubjectType("academic");
    }
    setIsDialogOpen(true);
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (selectedClasses.length === 0) {
      toast({
        title: "At least one class must be selected",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingSubject) {
        await updateSubject.mutateAsync({
          id: editingSubject.id,
          name: name.trim(),
          code: code.trim() || undefined,
          subject_type: subjectType,
          class_names: selectedClasses,
        });
      } else {
        await createSubject.mutateAsync({
          name: name.trim(),
          code: code.trim() || undefined,
          subject_type: subjectType,
          class_names: selectedClasses,
        });
      }
      setIsDialogOpen(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this subject? This will also delete all marks associated with it."
      )
    ) {
      try {
        await deleteSubject.mutateAsync(id);
      } catch {
        // Error handled by mutation
      }
    }
  };

  const getTypeLabel = (type: SubjectType) =>
    SUBJECT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <ProgressLayout>
      <PageHeader
        title="Subjects"
        description="Manage academic, co-curricular, and vocational subjects (NEP 2020)"
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
                  <DialogTitle>
                    {editingSubject ? "Edit Subject" : "Add Subject"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSubject
                      ? "Update the subject details below."
                      : "Enter the details for the new subject."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Subject Type *</Label>
                    <Select
                      value={subjectType}
                      onValueChange={(v) => setSubjectType(v as SubjectType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Subject Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        subjectType === "academic"
                          ? "e.g., Mathematics"
                          : subjectType === "co_curricular"
                          ? "e.g., Basketball"
                          : "e.g., Coding"
                      }
                    />
                    {existingMatch && (
                      <Alert className="py-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Subject already exists. It will be assigned to
                          selected classes.
                        </AlertDescription>
                      </Alert>
                    )}
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
                  <div className="grid gap-2">
                    <Label>Assign to Classes *</Label>
                    {uniqueClasses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No classes available. Add students first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {uniqueClasses.map((cls) => (
                          <label
                            key={cls}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <Checkbox
                              checked={selectedClasses.includes(cls)}
                              onCheckedChange={() => toggleClass(cls)}
                            />
                            {cls}
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedClasses.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedClasses.length} class
                        {selectedClasses.length > 1 ? "es" : ""} selected
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createSubject.isPending || updateSubject.isPending
                    }
                  >
                    {(createSubject.isPending || updateSubject.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingSubject
                      ? "Update"
                      : existingMatch
                      ? "Assign to Classes"
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-xl border-border/50 shadow-sm">
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
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned Classes</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">
                        {subject.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subject.code || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            SUBJECT_TYPE_COLORS[subject.subject_type] as any
                          }
                        >
                          {getTypeLabel(subject.subject_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subject.assigned_classes.length > 0 ? (
                            subject.assigned_classes.map((cls) => (
                              <Badge
                                key={cls}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cls}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CompetencyManager
                            subjectId={subject.id}
                            subjectName={subject.name}
                          />
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
