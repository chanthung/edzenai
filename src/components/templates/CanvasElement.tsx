import { CSSProperties, useCallback, useRef } from 'react';
import type { CanvasElementNode } from '@/lib/templates/types';
import { resolveField } from '@/lib/templates/resolve-fields';
import { Trash2 } from 'lucide-react';

interface CanvasElementProps {
  el: CanvasElementNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onChange: (next: CanvasElementNode) => void;
  onDelete: (id: string) => void;
  canvasWidth: number;
  canvasHeight: number;
}

const SNAP = 4;

export function CanvasElement({
  el,
  selected,
  onSelect,
  onChange,
  onDelete,
  canvasWidth,
  canvasHeight,
}: CanvasElementProps) {
  const dragState = useRef<{
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    handle?: string;
    orig: { x: number; y: number; w: number; h: number };
  } | null>(null);

  const onPointerDownMove = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).dataset.handle) return;
      e.stopPropagation();
      onSelect(el.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        mode: 'move',
        startX: e.clientX,
        startY: e.clientY,
        orig: { x: el.x, y: el.y, w: el.w, h: el.h },
      };
    },
    [el, onSelect]
  );

  const onPointerDownResize = useCallback(
    (handle: string) => (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(el.id);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        mode: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        handle,
        orig: { x: el.x, y: el.y, w: el.w, h: el.h },
      };
    },
    [el, onSelect]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;

      if (ds.mode === 'move') {
        let x = Math.round((ds.orig.x + dx) / SNAP) * SNAP;
        let y = Math.round((ds.orig.y + dy) / SNAP) * SNAP;
        x = Math.max(0, Math.min(canvasWidth - el.w, x));
        y = Math.max(0, Math.min(canvasHeight - el.h, y));
        onChange({ ...el, x, y });
      } else if (ds.mode === 'resize') {
        const h = ds.handle!;
        let { x, y, w, h: hh } = ds.orig;
        if (h.includes('e')) w = Math.max(20, Math.round((ds.orig.w + dx) / SNAP) * SNAP);
        if (h.includes('s')) hh = Math.max(20, Math.round((ds.orig.h + dy) / SNAP) * SNAP);
        if (h.includes('w')) {
          const nx = Math.round((ds.orig.x + dx) / SNAP) * SNAP;
          const nw = ds.orig.w - (nx - ds.orig.x);
          if (nw >= 20) { x = nx; w = nw; }
        }
        if (h.includes('n')) {
          const ny = Math.round((ds.orig.y + dy) / SNAP) * SNAP;
          const nh = ds.orig.h - (ny - ds.orig.y);
          if (nh >= 20) { y = ny; hh = nh; }
        }
        onChange({ ...el, x, y, w, h: hh });
      }
    },
    [el, onChange, canvasWidth, canvasHeight]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState.current) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
      dragState.current = null;
    }
  }, []);

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    boxSizing: 'border-box',
    cursor: 'move',
    userSelect: 'none',
  };

  const innerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    fontSize: el.style?.fontSize ?? 12,
    fontWeight: el.style?.fontWeight ?? 400,
    fontFamily: el.style?.fontFamily ?? 'Inter, Arial, sans-serif',
    color: el.style?.color ?? '#111111',
    textAlign: el.style?.align ?? 'left',
    backgroundColor: el.style?.bgColor,
    border: el.style?.borderWidth
      ? `${el.style.borderWidth}px solid ${el.style?.borderColor ?? '#000'}`
      : undefined,
    borderRadius: el.style?.borderRadius,
    padding: el.style?.padding,
    fontStyle: el.style?.italic ? 'italic' : undefined,
    textDecoration: el.style?.underline ? 'underline' : undefined,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const renderInner = () => {
    switch (el.type) {
      case 'text':
        return <div style={innerStyle}>{el.text || 'Text'}</div>;
      case 'field':
        return (
          <div style={innerStyle} className="text-primary">
            {resolveField(el.field ?? '', { data: null })}
          </div>
        );
      case 'image':
        return el.src ? (
          <img src={el.src} alt="" style={{ ...innerStyle, objectFit: 'contain' }} />
        ) : (
          <div
            style={{
              ...innerStyle,
              border: '1px dashed hsl(var(--muted-foreground))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
              fontSize: 11,
            }}
          >
            Image
          </div>
        );
      case 'line':
        return <div style={{ ...innerStyle, backgroundColor: el.style?.bgColor ?? '#111' }} />;
      case 'box':
        return (
          <div
            style={{
              ...innerStyle,
              border: `${el.style?.borderWidth ?? 1}px solid ${el.style?.borderColor ?? '#999'}`,
              backgroundColor: el.style?.bgColor ?? 'transparent',
            }}
          />
        );
      case 'signature_line':
        return (
          <div style={{ ...innerStyle, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ borderTop: '1px solid #444', width: '100%', marginTop: 'auto' }} />
            <div style={{ textAlign: 'center', fontSize: el.style?.fontSize ?? 11, color: '#444', paddingTop: 4 }}>
              {el.signatureLabel ?? 'Signature'}
            </div>
          </div>
        );
      case 'marks_table':
        return (
          <div
            style={{
              ...innerStyle,
              border: '1px dashed hsl(var(--primary) / 0.4)',
              background: 'hsl(var(--primary) / 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'hsl(var(--primary))',
            }}
          >
            Marks Table (auto-fills with subjects & terms)
          </div>
        );
    }
  };

  const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  return (
    <div
      style={baseStyle}
      onPointerDown={onPointerDownMove}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={selected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/40'}
    >
      {renderInner()}
      {selected && (
        <>
          {handles.map(h => (
            <div
              key={h}
              data-handle={h}
              onPointerDown={onPointerDownResize(h)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className="absolute bg-primary border border-white"
              style={{
                width: 8,
                height: 8,
                ...handlePos(h),
                cursor: handleCursor(h),
              }}
            />
          ))}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
            className="absolute -top-7 right-0 bg-destructive text-destructive-foreground rounded-md px-1.5 py-0.5 text-xs flex items-center gap-1 shadow-sm"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </>
      )}
    </div>
  );
}

function handlePos(h: string): CSSProperties {
  const map: Record<string, CSSProperties> = {
    nw: { left: -4, top: -4 },
    n: { left: '50%', top: -4, marginLeft: -4 },
    ne: { right: -4, top: -4 },
    e: { right: -4, top: '50%', marginTop: -4 },
    se: { right: -4, bottom: -4 },
    s: { left: '50%', bottom: -4, marginLeft: -4 },
    sw: { left: -4, bottom: -4 },
    w: { left: -4, top: '50%', marginTop: -4 },
  };
  return map[h];
}

function handleCursor(h: string) {
  const map: Record<string, string> = {
    nw: 'nwse-resize', se: 'nwse-resize',
    ne: 'nesw-resize', sw: 'nesw-resize',
    n: 'ns-resize', s: 'ns-resize',
    e: 'ew-resize', w: 'ew-resize',
  };
  return map[h];
}
