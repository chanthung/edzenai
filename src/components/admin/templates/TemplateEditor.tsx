import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useCreateTemplate,
  useUpdateTemplate,
  useTemplateTerms,
  useSaveTemplateTerms,
  useTemplateComponents,
  useSaveTemplateComponents,
  useSaveTemplateGradeMappings,
  type AssessmentTemplate,
} from "@/hooks/progress/useAssessmentTemplates";
import { GradeMappingEditor } from "./GradeMappingEditor";
import { GenerateTemplateDialog, type GeneratedTemplate } from "./GenerateTemplateDialog";
import { toast } from "sonner";
import { Save, ArrowLeft, Plus, Trash2, Loader2, GripVertical, Sparkles } from "lucide-react";

interface TemplateEditorProps {
  template: AssessmentTemplate | null; // null = creating new
  onBack: () => void;
}

interface LocalTerm {
  key: string;
  name: string;
  display_order: number;
}

interface LocalComponent {
  key: string;
  name: string;
  max_marks: number;
  display_order: number;
}

export function TemplateEditor({ template, onBack }: TemplateEditorProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const { data: existingTerms } = useTemplateTerms(template?.id ?? null);
  const { data: existingComponents } = useTemplateComponents(template?.id ?? null);
  const saveTerms = useSaveTemplateTerms();
  const saveComponents = useSaveTemplateComponents();
  const saveGradeMappings = useSaveTemplateGradeMappings();

  const [name, setName] = useState(template?.name ?? "");
  const [gradingType, setGradingType] = useState<'percentage' | 'custom_grades'>(template?.grading_type ?? 'percentage');
  const [isDefault, setIsDefault] = useState(template?.is_default ?? false);

  const [terms, setTerms] = useState<LocalTerm[]>([]);
  const [components, setComponents] = useState<LocalComponent[]>([]);
  const [pendingGradeMappings, setPendingGradeMappings] = useState<{ grade_label: string; min_percentage: number; max_percentage: number }[] | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingTerms) {
      setTerms(existingTerms.map(t => ({ key: t.id, name: t.name, display_order: t.display_order })));
    }
  }, [existingTerms]);

  useEffect(() => {
    if (existingComponents) {
      setComponents(existingComponents.map(c => ({ key: c.id, name: c.name, max_marks: c.max_marks, display_order: c.display_order })));
    }
  }, [existingComponents]);

  const addTerm = () => setTerms(prev => [...prev, { key: crypto.randomUUID(), name: "", display_order: prev.length }]);
  const removeTerm = (key: string) => setTerms(prev => prev.filter(t => t.key !== key).map((t, i) => ({ ...t, display_order: i })));

  const addComponent = () => setComponents(prev => [...prev, { key: crypto.randomUUID(), name: "", max_marks: 100, display_order: prev.length }]);
  const removeComponent = (key: string) => setComponents(prev => prev.filter(c => c.key !== key).map((c, i) => ({ ...c, display_order: i })));

  const handleAIGenerated = (gen: GeneratedTemplate) => {
    if (gen.name) setName(gen.name);
    setGradingType(gen.grading_type);
    setTerms((gen.terms ?? []).map((t, i) => ({ key: crypto.randomUUID(), name: t.name, display_order: i })));
    setComponents((gen.components ?? []).map((c, i) => ({ key: crypto.randomUUID(), name: c.name, max_marks: Number(c.max_marks) || 0, display_order: i })));
    if (gen.grading_type === 'custom_grades' && gen.grade_mappings?.length) {
      setPendingGradeMappings(
        gen.grade_mappings.map(m => ({
          grade_label: m.grade_label,
          min_percentage: Number(m.min_percentage),
          max_percentage: Number(m.max_percentage),
        }))
      );
    } else {
      setPendingGradeMappings(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Template name is required"); return; }
    setSaving(true);
    try {
      let templateId = template?.id;

      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, name, grading_type: gradingType, is_default: isDefault });
      } else {
        const created = await createTemplate.mutateAsync({ name, grading_type: gradingType, is_default: isDefault });
        templateId = created.id;
      }

      // Save terms & components
      const validTerms = terms.filter(t => t.name.trim());
      const validComponents = components.filter(c => c.name.trim());

      await Promise.all([
        saveTerms.mutateAsync({ templateId: templateId!, terms: validTerms.map(({ name, display_order }) => ({ name, display_order })) }),
        saveComponents.mutateAsync({ templateId: templateId!, components: validComponents.map(({ name, max_marks, display_order }) => ({ name, max_marks, display_order })) }),
      ]);

      // Save AI-generated grade mappings if pending
      if (pendingGradeMappings && gradingType === 'custom_grades') {
        await saveGradeMappings.mutateAsync({
          templateId: templateId!,
          mappings: pendingGradeMappings.map((m, i) => ({ ...m, display_order: i })),
        });
        setPendingGradeMappings(null);
      }

      toast.success(template ? "Template updated" : "Template created");
      onBack();
    } catch (e: any) {
      toast.error("Failed to save template", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{template ? "Edit Template" : "Create Template"}</h3>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Template
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="card-elevated">
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="e.g. ICSE Primary, CBSE Term System" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Grading System</Label>
              <Select value={gradingType} onValueChange={(v: 'percentage' | 'custom_grades') => setGradingType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage-based</SelectItem>
                  <SelectItem value="custom_grades">Custom Grades</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label>Set as default template</Label>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="card-elevated">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Terms / Exams</CardTitle>
          <Button variant="outline" size="sm" onClick={addTerm}><Plus className="h-3.5 w-3.5 mr-1" /> Add Term</Button>
        </CardHeader>
        <CardContent>
          {terms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No terms added yet. Add terms like "Term 1", "Term 2", "Final".</p>
          ) : (
            <div className="space-y-2">
              {terms.map((t, i) => (
                <div key={t.key} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={`Term ${i + 1}`}
                    value={t.name}
                    onChange={e => setTerms(prev => prev.map(x => x.key === t.key ? { ...x, name: e.target.value } : x))}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeTerm(t.key)} className="text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Components */}
      <Card className="card-elevated">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Mark Components</CardTitle>
          <Button variant="outline" size="sm" onClick={addComponent}><Plus className="h-3.5 w-3.5 mr-1" /> Add Component</Button>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <p className="text-sm text-muted-foreground">No components added yet. Add components like "Internal", "External", "Project".</p>
          ) : (
            <div className="space-y-2">
              {components.map((c, i) => (
                <div key={c.key} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={`Component ${i + 1}`}
                    value={c.name}
                    onChange={e => setComponents(prev => prev.map(x => x.key === c.key ? { ...x, name: e.target.value } : x))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Max marks"
                    value={c.max_marks || ""}
                    onChange={e => setComponents(prev => prev.map(x => x.key === c.key ? { ...x, max_marks: Number(e.target.value) } : x))}
                    className="w-28"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeComponent(c.key)} className="text-destructive shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">
                Total max marks: {components.reduce((sum, c) => sum + (c.max_marks || 0), 0)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Mappings (only for custom_grades) */}
      {gradingType === 'custom_grades' && template?.id && (
        <>
          <Separator />
          <GradeMappingEditor templateId={template.id} />
        </>
      )}

      {gradingType === 'custom_grades' && !template?.id && (
        <Card className="card-elevated">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              Save the template first, then configure grade mappings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
