import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useCompetencies, useCreateCompetency, useUpdateCompetency, useDeleteCompetency, type Competency } from "@/hooks/progress/useCompetencies";
import { Settings2, Plus, Edit, Trash2, Loader2, Target } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface CompetencyManagerProps {
  subjectId: string;
  subjectName: string;
}

export function CompetencyManager({ subjectId, subjectName }: CompetencyManagerProps) {
  const { data: competencies = [], isLoading } = useCompetencies(subjectId);
  const create = useCreateCompetency();
  const update = useUpdateCompetency();
  const remove = useDeleteCompetency();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Competency | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create.mutateAsync({ subject_id: subjectId, name: name.trim(), description: description.trim() || undefined });
    setName(""); setDescription("");
  };

  const handleEdit = (c: Competency) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || "");
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !name.trim()) return;
    await update.mutateAsync({ id: editing.id, name: name.trim(), description: description.trim() || undefined });
    setEditOpen(false); setEditing(null); setName(""); setDescription("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this competency? Related scores will also be removed.")) {
      await remove.mutateAsync(id);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Manage Competencies">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Competencies — {subjectName}</DialogTitle>
            <DialogDescription>Define learning outcomes / skills for this subject.</DialogDescription>
          </DialogHeader>

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex flex-col gap-3 border-b border-border pb-4">
            <div className="grid gap-1.5">
              <Label>Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Number Sense" />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional detail" rows={2} />
            </div>
            <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
              {create.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add Competency
            </Button>
          </form>

          {/* List */}
          <div className="max-h-64 overflow-y-auto space-y-2 mt-2">
            {isLoading ? (
              <div className="h-16 bg-muted animate-pulse rounded" />
            ) : competencies.length === 0 ? (
              <EmptyState icon={Target} title="No competencies" description="Add competencies above." />
            ) : (
              competencies.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)} disabled={remove.isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Competency</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending || !name.trim()}>
                {update.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
