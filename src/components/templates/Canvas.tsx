import { useDroppable } from '@dnd-kit/core';
import { useMemo, useRef, forwardRef } from 'react';
import type { CanvasElementNode, DocumentTemplate } from '@/lib/templates/types';
import { getCanvasSize } from '@/lib/templates/types';
import { CanvasElement } from './CanvasElement';

interface CanvasProps {
  template: DocumentTemplate;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChangeElement: (next: CanvasElementNode) => void;
  onDeleteElement: (id: string) => void;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  template,
  selectedId,
  onSelect,
  onChangeElement,
  onDeleteElement,
}, exportRef) => {
  const size = useMemo(
    () => getCanvasSize(template.paper_size, template.orientation),
    [template.paper_size, template.orientation]
  );
  const { setNodeRef } = useDroppable({ id: 'canvas-drop' });
  const innerRef = useRef<HTMLDivElement>(null);

  const composedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    (innerRef as any).current = node;
    if (typeof exportRef === 'function') exportRef(node);
    else if (exportRef) (exportRef as any).current = node;
  };

  return (
    <div className="flex-1 overflow-auto bg-muted/40">
      <div className="min-h-full flex justify-center py-8 px-6">
        <div
          ref={composedRef}
          data-canvas="true"
          onClick={() => onSelect(null)}
          className="relative bg-white shadow-lg"
          style={{
            width: size.w,
            height: size.h,
            backgroundImage:
              'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {template.elements.map(el => (
            <CanvasElement
              key={el.id}
              el={el}
              selected={selectedId === el.id}
              onSelect={onSelect}
              onChange={onChangeElement}
              onDelete={onDeleteElement}
              canvasWidth={size.w}
              canvasHeight={size.h}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
Canvas.displayName = 'Canvas';
