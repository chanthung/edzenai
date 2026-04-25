import { useNavigate } from 'react-router-dom';
import { ProgressLayout } from '@/components/progress/ProgressLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Plus, Star, Trash2, Pencil, Loader2 } from 'lucide-react';
import { useDocumentTemplates, useCreateTemplate, useDeleteTemplate, useSetDefaultTemplate } from '@/hooks/templates/useDocumentTemplates';
import { DEFAULT_REPORT_CARD_ELEMENTS } from '@/lib/templates/default-report-card';
import { toast } from 'sonner';

export default function ReportCardTemplates() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useDocumentTemplates('report_card');
  const createMut = useCreateTemplate();
  const deleteMut = useDeleteTemplate();
  const setDefaultMut = useSetDefaultTemplate();

  const handleCreate = async () => {
    try {
      const t = await createMut.mutateAsync({
        name: `Template ${templates.length + 1}`,
        elements: DEFAULT_REPORT_CARD_ELEMENTS,
      });
      navigate(`/progress/report-card-templates/${t.id}`);
    } catch (e: any) { toast.error(e.message || 'Failed to create'); }
  };

  return (
    <ProgressLayout>
      <PageHeader
        title="Report Card Templates"
        description="Design your school's branded report card with drag-and-drop. Set one as default to use across the school."
      >
        <Button onClick={handleCreate} disabled={createMut.isPending}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </PageHeader>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No templates yet"
            description="Create your first report card template to design your school's branded layout."
            action={
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Create your first template
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{t.name}</h3>
                        {t.is_default && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-current" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.paper_size} · {t.orientation} · {t.elements.length} elements
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/progress/report-card-templates/${t.id}`)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    {!t.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => t.id && setDefaultMut.mutate(t.id, { onSuccess: () => toast.success('Set as default') })}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!t.id) return;
                        if (!confirm(`Delete "${t.name}"?`)) return;
                        deleteMut.mutate(t.id, { onSuccess: () => toast.success('Deleted') });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProgressLayout>
  );
}
