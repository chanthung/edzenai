import { useDraggable } from '@dnd-kit/core';
import { FIELD_REGISTRY, FIELD_GROUPS } from '@/lib/templates/field-registry';
import { Type, Image as ImageIcon, Minus, Square, Table, PenLine } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SHAPES = [
  { kind: 'text', label: 'Text', icon: Type },
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'line', label: 'Line', icon: Minus },
  { kind: 'box', label: 'Box', icon: Square },
  { kind: 'marks_table', label: 'Marks Table', icon: Table },
  { kind: 'signature_line', label: 'Signature', icon: PenLine },
] as const;

function DraggableChip({
  id,
  label,
  payload,
  icon: Icon,
}: {
  id: string;
  label: string;
  payload: any;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: payload,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing select-none rounded-md border bg-card px-2.5 py-1.5 text-xs hover:bg-accent hover:border-primary/40 transition-colors flex items-center gap-1.5 ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      {Icon ? <Icon className="h-3 w-3 text-muted-foreground" /> : null}
      <span className="truncate">{label}</span>
    </div>
  );
}

export function FieldChipsRail() {
  return (
    <div className="w-64 shrink-0 border-r bg-muted/20 flex flex-col">
      <Tabs defaultValue="fields" className="flex-1 flex flex-col">
        <TabsList className="m-2">
          <TabsTrigger value="fields" className="flex-1 text-xs">Fields</TabsTrigger>
          <TabsTrigger value="elements" className="flex-1 text-xs">Elements</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-3 space-y-4">
              {FIELD_GROUPS.filter(g => g !== 'Signatures').map(group => {
                const items = FIELD_REGISTRY.filter(f => f.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                      {group}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(f => (
                        <DraggableChip
                          key={f.token}
                          id={`field:${f.token}`}
                          label={f.label}
                          payload={{ kind: 'field', field: f.token }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="elements" className="flex-1 m-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-3 grid grid-cols-2 gap-2">
              {SHAPES.map(s => (
                <DraggableChip
                  key={s.kind}
                  id={`shape:${s.kind}`}
                  label={s.label}
                  payload={{ kind: 'shape', elementType: s.kind }}
                  icon={s.icon}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
