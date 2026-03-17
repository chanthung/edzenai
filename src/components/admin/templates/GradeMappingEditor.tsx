import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplateGradeMappings, useSaveTemplateGradeMappings } from "@/hooks/progress/useAssessmentTemplates";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

interface LocalMapping {
  key: string;
  min_percentage: number;
  max_percentage: number;
  grade_label: string;
  display_order: number;
}

const DEFAULT_MAPPINGS: Omit<LocalMapping, 'key'>[] = [
  { min_percentage: 91, max_percentage: 100, grade_label: 'A+', display_order: 0 },
  { min_percentage: 81, max_percentage: 90, grade_label: 'A', display_order: 1 },
  { min_percentage: 71, max_percentage: 80, grade_label: 'B+', display_order: 2 },
  { min_percentage: 61, max_percentage: 70, grade_label: 'B', display_order: 3 },
  { min_percentage: 51, max_percentage: 60, grade_label: 'C+', display_order: 4 },
  { min_percentage: 41, max_percentage: 50, grade_label: 'C', display_order: 5 },
  { min_percentage: 33, max_percentage: 40, grade_label: 'D', display_order: 6 },
  { min_percentage: 0, max_percentage: 32, grade_label: 'E', display_order: 7 },
];

export function GradeMappingEditor({ templateId }: { templateId: string }) {
  const { data: existing } = useTemplateGradeMappings(templateId);
  const saveMappings = useSaveTemplateGradeMappings();
  const [mappings, setMappings] = useState<LocalMapping[]>([]);

  useEffect(() => {
    if (existing && existing.length > 0) {
      setMappings(existing.map(m => ({ ...m, key: m.id })));
    } else if (existing && existing.length === 0) {
      // Pre-fill with defaults
      setMappings(DEFAULT_MAPPINGS.map(m => ({ ...m, key: crypto.randomUUID() })));
    }
  }, [existing]);

  const add = () => setMappings(prev => [...prev, { key: crypto.randomUUID(), min_percentage: 0, max_percentage: 0, grade_label: '', display_order: prev.length }]);
  const remove = (key: string) => setMappings(prev => prev.filter(m => m.key !== key).map((m, i) => ({ ...m, display_order: i })));

  const handleSave = async () => {
    const valid = mappings.filter(m => m.grade_label.trim());
    try {
      await saveMappings.mutateAsync({
        templateId,
        mappings: valid.map(({ min_percentage, max_percentage, grade_label, display_order }) => ({
          min_percentage, max_percentage, grade_label, display_order,
        })),
      });
      toast.success("Grade mappings saved");
    } catch (e: any) {
      toast.error("Failed to save grade mappings", { description: e.message });
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Grade Mappings</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
          <Button size="sm" onClick={handleSave} disabled={saveMappings.isPending}>
            {saveMappings.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No grade mappings. Click "Add" to define grade boundaries.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_80px_80px_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Grade</span><span>Min %</span><span>Max %</span><span></span>
            </div>
            {mappings.map(m => (
              <div key={m.key} className="grid grid-cols-[1fr_80px_80px_auto] gap-2 items-center">
                <Input value={m.grade_label} onChange={e => setMappings(prev => prev.map(x => x.key === m.key ? { ...x, grade_label: e.target.value } : x))} placeholder="A+" />
                <Input type="number" value={m.min_percentage || ""} onChange={e => setMappings(prev => prev.map(x => x.key === m.key ? { ...x, min_percentage: Number(e.target.value) } : x))} />
                <Input type="number" value={m.max_percentage || ""} onChange={e => setMappings(prev => prev.map(x => x.key === m.key ? { ...x, max_percentage: Number(e.target.value) } : x))} />
                <Button variant="ghost" size="icon" onClick={() => remove(m.key)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
