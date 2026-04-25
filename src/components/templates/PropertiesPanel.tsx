import type { CanvasElementNode } from '@/lib/templates/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FIELD_REGISTRY } from '@/lib/templates/field-registry';
import { Button } from '@/components/ui/button';

interface PropertiesPanelProps {
  selected: CanvasElementNode | null;
  onChange: (next: CanvasElementNode) => void;
  onDelete: (id: string) => void;
}

export function PropertiesPanel({ selected, onChange, onDelete }: PropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="w-64 shrink-0 border-l bg-muted/20 p-4 text-sm text-muted-foreground">
        Select an element to edit its properties.
      </div>
    );
  }

  const update = (patch: Partial<CanvasElementNode>) => onChange({ ...selected, ...patch });
  const updateStyle = (patch: Partial<NonNullable<CanvasElementNode['style']>>) =>
    onChange({ ...selected, style: { ...(selected.style ?? {}), ...patch } });

  return (
    <div className="w-72 shrink-0 border-l bg-muted/20 flex flex-col">
      <div className="p-3 border-b bg-card">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Properties
        </div>
        <div className="text-sm font-medium capitalize">{selected.type.replace('_', ' ')}</div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Type-specific */}
          {selected.type === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Text</Label>
              <Textarea
                value={selected.text ?? ''}
                onChange={(e) => update({ text: e.target.value })}
                rows={3}
              />
            </div>
          )}
          {selected.type === 'field' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Field</Label>
              <Select value={selected.field} onValueChange={(v) => update({ field: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_REGISTRY.map(f => (
                    <SelectItem key={f.token} value={f.token}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selected.type === 'image' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Image URL</Label>
              <Input
                value={selected.src ?? ''}
                onChange={(e) => update({ src: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
          {selected.type === 'signature_line' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Input
                value={selected.signatureLabel ?? ''}
                onChange={(e) => update({ signatureLabel: e.target.value })}
              />
            </div>
          )}
          {selected.type === 'marks_table' && (
            <div className="space-y-2">
              <ToggleRow
                label="Show Percentage"
                checked={selected.tableConfig?.showPercentage !== false}
                onCheckedChange={(v) => update({ tableConfig: { ...selected.tableConfig, showPercentage: v } })}
              />
              <ToggleRow
                label="Show Grade"
                checked={selected.tableConfig?.showGrade !== false}
                onCheckedChange={(v) => update({ tableConfig: { ...selected.tableConfig, showGrade: v } })}
              />
              <ToggleRow
                label="Show Total Row"
                checked={selected.tableConfig?.showOverall !== false}
                onCheckedChange={(v) => update({ tableConfig: { ...selected.tableConfig, showOverall: v } })}
              />
            </div>
          )}

          <Separator />

          {/* Position & size */}
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="X" value={selected.x} onChange={(v) => update({ x: v })} />
            <NumberField label="Y" value={selected.y} onChange={(v) => update({ y: v })} />
            <NumberField label="W" value={selected.w} onChange={(v) => update({ w: v })} />
            <NumberField label="H" value={selected.h} onChange={(v) => update({ h: v })} />
          </div>

          {/* Typography (skip for line/box/image) */}
          {!['line', 'box', 'image'].includes(selected.type) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Font Size"
                    value={selected.style?.fontSize ?? 12}
                    onChange={(v) => updateStyle({ fontSize: v })}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs">Weight</Label>
                    <Select
                      value={String(selected.style?.fontWeight ?? 400)}
                      onValueChange={(v) => updateStyle({ fontWeight: Number(v) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semibold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Align</Label>
                  <Select
                    value={selected.style?.align ?? 'left'}
                    onValueChange={(v) => updateStyle({ align: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ColorField
                  label="Text Color"
                  value={selected.style?.color ?? '#111111'}
                  onChange={(v) => updateStyle({ color: v })}
                />
              </div>
            </>
          )}

          <Separator />
          <ColorField
            label={selected.type === 'line' ? 'Color' : 'Background'}
            value={selected.style?.bgColor ?? ''}
            onChange={(v) => updateStyle({ bgColor: v })}
          />

          <Separator />
          <Button variant="destructive" size="sm" className="w-full" onClick={() => onDelete(selected.id)}>
            Delete element
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-8"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-12 p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-8 flex-1"
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
