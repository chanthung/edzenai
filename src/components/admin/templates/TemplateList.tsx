import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useAssessmentTemplates, useDeleteTemplate, type AssessmentTemplate } from "@/hooks/progress/useAssessmentTemplates";
import { Plus, Edit2, Trash2, FileText, Star } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TemplateListProps {
  onEdit: (template: AssessmentTemplate) => void;
  onCreate: () => void;
  isRestricted: boolean;
}

export function TemplateList({ onEdit, onCreate, isRestricted }: TemplateListProps) {
  const { data: templates, isLoading } = useAssessmentTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success("Template deleted");
    } catch (e: any) {
      toast.error("Failed to delete template", { description: e.message });
    }
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Card key={i} className="card-elevated">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-4 w-60" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!templates?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No assessment templates"
        description="Create a template to define terms, components, and grading rules for your school."
        action={
          <Button onClick={onCreate} disabled={isRestricted}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={onCreate} disabled={isRestricted} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.map(t => (
        <Card key={t.id} className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{t.name}</CardTitle>
                {t.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" /> Default
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(t)} disabled={isRestricted}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)} disabled={isRestricted} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Grading: {t.grading_type === 'percentage' ? 'Percentage-based' : 'Custom Grades'}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template and all its terms, components, and grade mappings. Classes assigned to this template will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
