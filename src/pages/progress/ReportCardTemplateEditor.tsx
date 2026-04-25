import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ProgressLayout } from '@/components/progress/ProgressLayout';
import { FieldChipsRail } from '@/components/templates/FieldChipsRail';
import { Canvas } from '@/components/templates/Canvas';
import { PropertiesPanel } from '@/components/templates/PropertiesPanel';
import { TemplateRenderer } from '@/components/templates/TemplateRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDocumentTemplate, useUpdateTemplate, useSetDefaultTemplate } from '@/hooks/templates/useDocumentTemplates';
import { useResolvedStudents } from '@/hooks/progress/useResolvedStudents';
import { useResolvedActiveAcademicYear } from '@/hooks/progress/useResolvedAcademicYears';
import { useReportCard } from '@/hooks/progress/useReportCard';
import type { CanvasElementNode, DocumentTemplate, PaperSize, Orientation } from '@/lib/templates/types';
import { exportNodeToPdf } from '@/lib/templates/pdf-export';
import { ArrowLeft, Save, Eye, Download, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

let _idc = 0;
const newId = () => `el_${Date.now()}_${++_idc}`;

export default function ReportCardTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: loaded, isLoading } = useDocumentTemplate(id ?? null);
  const updateMut = useUpdateTemplate();
  const setDefaultMut = useSetDefaultTemplate();

  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStudentId, setPreviewStudentId] = useState<string>('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { data: students = [] } = useResolvedStudents();
  const activeYear = useResolvedActiveAcademicYear();
  const { data: previewData } = useReportCard(previewStudentId || null, activeYear?.id ?? null);

  useEffect(() => {
    if (loaded && !template) setTemplate(loaded);
  }, [loaded, template]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (isLoading || !template) {
    return (
      <ProgressLayout>
        <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading template…
        </div>
      </ProgressLayout>
    );
  }

  const updateElement = (next: CanvasElementNode) => {
    setTemplate({ ...template, elements: template.elements.map(e => e.id === next.id ? next : e) });
  };
  const deleteElement = (eid: string) => {
    setTemplate({ ...template, elements: template.elements.filter(e => e.id !== eid) });
    if (selectedId === eid) setSelectedId(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (e.over?.id !== 'canvas-drop') return;
    const payload = e.active.data.current as any;
    if (!payload) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const dropX = (e.activatorEvent as PointerEvent).clientX + e.delta.x - rect.left;
    const dropY = (e.activatorEvent as PointerEvent).clientY + e.delta.y - rect.top;

    let node: CanvasElementNode;
    if (payload.kind === 'field') {
      node = {
        id: newId(), type: 'field', field: payload.field,
        x: Math.max(0, Math.round(dropX)), y: Math.max(0, Math.round(dropY)),
        w: 180, h: 24, style: { fontSize: 12, color: '#111111' },
      };
    } else {
      const t = payload.elementType as CanvasElementNode['type'];
      const defaults: Partial<CanvasElementNode> = (() => {
        switch (t) {
          case 'text': return { text: 'New text', w: 160, h: 24, style: { fontSize: 12 } };
          case 'image': return { w: 120, h: 120 };
          case 'line': return { w: 200, h: 2, style: { bgColor: '#111' } };
          case 'box': return { w: 160, h: 80, style: { borderWidth: 1, borderColor: '#999' } };
          case 'marks_table': return { w: 600, h: 240, tableConfig: { showGrade: true, showPercentage: true, showOverall: true } };
          case 'signature_line': return { w: 180, h: 40, signatureLabel: 'Signature' };
          default: return { w: 100, h: 40 };
        }
      })();
      node = {
        id: newId(), type: t,
        x: Math.max(0, Math.round(dropX)), y: Math.max(0, Math.round(dropY)),
        w: 100, h: 40, ...defaults,
      } as CanvasElementNode;
    }
    setTemplate({ ...template, elements: [...template.elements, node] });
    setSelectedId(node.id);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync(template);
      toast.success('Template saved');
    } catch (e: any) { toast.error(e.message || 'Save failed'); }
  };

  const handleExport = async () => {
    const node = previewOpen ? previewRef.current : canvasRef.current;
    if (!node) return;
    try {
      await exportNodeToPdf(node, `${template.name || 'template'}.pdf`, template.paper_size, template.orientation);
      toast.success('PDF downloaded');
    } catch (e: any) { toast.error(e.message || 'Export failed'); }
  };

  const handleSetDefault = async () => {
    if (!template.id) return;
    try {
      await setDefaultMut.mutateAsync(template.id);
      setTemplate({ ...template, is_default: true });
      toast.success('Set as default report card template');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
  };

  const selected = template.elements.find(e => e.id === selectedId) ?? null;

  return (
    <ProgressLayout>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 p-3 bg-card border rounded-xl">
          <Button variant="ghost" size="sm" onClick={() => navigate('/progress/report-card-templates')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Input
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            className="max-w-xs h-9"
          />
          <Select value={template.paper_size} onValueChange={(v) => setTemplate({ ...template, paper_size: v as PaperSize })}>
            <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="A5">A5</SelectItem>
              <SelectItem value="Letter">Letter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={template.orientation} onValueChange={(v) => setTemplate({ ...template, orientation: v as Orientation })}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleSetDefault} disabled={template.is_default}>
              <Star className={`h-4 w-4 mr-1 ${template.is_default ? 'fill-current' : ''}`} />
              {template.is_default ? 'Default' : 'Set Default'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMut.isPending}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>

        <div className="flex border rounded-xl overflow-hidden bg-card" style={{ height: 'calc(100vh - 220px)' }}>
          <FieldChipsRail />
          <Canvas
            ref={canvasRef}
            template={template}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangeElement={updateElement}
            onDeleteElement={deleteElement}
          />
          <PropertiesPanel selected={selected} onChange={updateElement} onDelete={deleteElement} />
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Preview with real data</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mb-3">
              <Select value={previewStudentId} onValueChange={setPreviewStudentId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Choose student to preview" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.class_name ? `· ${s.class_name}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export PDF
              </Button>
            </div>
            <div className="flex justify-center bg-muted/30 p-4">
              <TemplateRenderer ref={previewRef} template={template} data={previewData} />
            </div>
          </DialogContent>
        </Dialog>
      </DndContext>
    </ProgressLayout>
  );
}
