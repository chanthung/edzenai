import { CSSProperties, forwardRef, useMemo } from 'react';
import type { CanvasElementNode, DocumentTemplate } from '@/lib/templates/types';
import { getCanvasSize } from '@/lib/templates/types';
import { resolveField, type ResolveContext } from '@/lib/templates/resolve-fields';
import type { ReportCardData } from '@/hooks/progress/useReportCard';

interface TemplateRendererProps {
  template: DocumentTemplate;
  data?: ReportCardData | null;
  schoolPhone?: string | null;
  /** When true, render edit-mode placeholders (no data resolution shown if missing). */
  showPlaceholders?: boolean;
}

export const TemplateRenderer = forwardRef<HTMLDivElement, TemplateRendererProps>(
  ({ template, data, schoolPhone, showPlaceholders = false }, ref) => {
    const size = useMemo(
      () => getCanvasSize(template.paper_size, template.orientation),
      [template.paper_size, template.orientation]
    );
    const ctx: ResolveContext = { data, schoolPhone };

    return (
      <div
        ref={ref}
        className="bg-white shadow-sm relative"
        style={{ width: size.w, height: size.h }}
      >
        {template.elements.map(el => (
          <RenderedElement
            key={el.id}
            el={el}
            ctx={ctx}
            data={data}
            showPlaceholders={showPlaceholders}
          />
        ))}
      </div>
    );
  }
);
TemplateRenderer.displayName = 'TemplateRenderer';

function elStyle(el: CanvasElementNode): CSSProperties {
  const s = el.style ?? {};
  return {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    fontSize: s.fontSize ?? 12,
    fontWeight: s.fontWeight ?? 400,
    fontFamily: s.fontFamily ?? 'Inter, Arial, sans-serif',
    color: s.color ?? '#111111',
    textAlign: s.align ?? 'left',
    backgroundColor: s.bgColor,
    border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor ?? '#000'}` : undefined,
    borderRadius: s.borderRadius,
    padding: s.padding,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };
}

interface RenderedElementProps {
  el: CanvasElementNode;
  ctx: ResolveContext;
  data?: ReportCardData | null;
  showPlaceholders: boolean;
}

function RenderedElement({ el, ctx, data, showPlaceholders }: RenderedElementProps) {
  const baseStyle = elStyle(el);

  switch (el.type) {
    case 'text':
      return <div style={baseStyle}>{el.text ?? ''}</div>;

    case 'field': {
      const text = showPlaceholders
        ? el.field ?? ''
        : resolveField(el.field ?? '', ctx);
      return <div style={baseStyle}>{text || (showPlaceholders ? el.field : '')}</div>;
    }

    case 'image': {
      const src = el.src;
      if (!src) {
        return (
          <div
            style={{
              ...baseStyle,
              border: '1px dashed #999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 11,
            }}
          >
            Image
          </div>
        );
      }
      return (
        <img
          src={src}
          alt=""
          style={{ ...baseStyle, objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
      );
    }

    case 'line':
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: el.style?.bgColor ?? '#111',
            height: el.h || 2,
          }}
        />
      );

    case 'box':
      return (
        <div
          style={{
            ...baseStyle,
            border: `${el.style?.borderWidth ?? 1}px solid ${el.style?.borderColor ?? '#999'}`,
            backgroundColor: el.style?.bgColor ?? 'transparent',
          }}
        />
      );

    case 'signature_line':
      return (
        <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ borderTop: '1px solid #444', width: '100%', marginTop: 'auto' }} />
          <div style={{ textAlign: 'center', fontSize: el.style?.fontSize ?? 11, color: '#444', paddingTop: 4 }}>
            {el.signatureLabel ?? 'Signature'}
          </div>
        </div>
      );

    case 'marks_table':
      return <MarksTableElement el={el} data={data} showPlaceholders={showPlaceholders} />;

    default:
      return null;
  }
}

function MarksTableElement({
  el,
  data,
  showPlaceholders,
}: {
  el: CanvasElementNode;
  data?: ReportCardData | null;
  showPlaceholders: boolean;
}) {
  const config = el.tableConfig ?? {};
  const baseStyle = elStyle(el);
  const fontSize = el.style?.fontSize ?? 11;

  const rows = data?.scholastic ?? [];
  const terms = data?.termNames ?? [];

  if (showPlaceholders || !data || rows.length === 0) {
    // Placeholder preview (sample table)
    const sampleTerms = terms.length ? terms : ['Term 1', 'Term 2'];
    const sampleSubjects = rows.length
      ? rows.map(r => r.subjectName)
      : ['English', 'Mathematics', 'Science', 'Social Studies'];
    return (
      <div style={{ ...baseStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize }}>
          <thead>
            <tr style={{ background: '#eef2f7' }}>
              <th style={cellStyle(true)}>Subject</th>
              {sampleTerms.map(t => (
                <th key={t} style={cellStyle(true)}>{t}</th>
              ))}
              {config.showPercentage !== false && <th style={cellStyle(true)}>%</th>}
              {config.showGrade !== false && <th style={cellStyle(true)}>Grade</th>}
            </tr>
          </thead>
          <tbody>
            {sampleSubjects.map((sub, i) => (
              <tr key={i}>
                <td style={cellStyle(false, true)}>{sub}</td>
                {sampleTerms.map(t => (
                  <td key={t} style={cellStyle()}>—</td>
                ))}
                {config.showPercentage !== false && <td style={cellStyle()}>—</td>}
                {config.showGrade !== false && <td style={cellStyle()}>—</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ ...baseStyle, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize }}>
        <thead>
          <tr style={{ background: '#eef2f7' }}>
            <th style={cellStyle(true)}>Subject</th>
            {terms.map(t => (
              <th key={t} style={cellStyle(true)}>{t}</th>
            ))}
            {config.showPercentage !== false && <th style={cellStyle(true)}>%</th>}
            {config.showGrade !== false && <th style={cellStyle(true)}>Grade</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.subjectId}>
              <td style={cellStyle(false, true)}>{row.subjectName}</td>
              {terms.map(t => {
                const term = row.terms[t];
                return (
                  <td key={t} style={cellStyle()}>
                    {term ? `${term.marksObtained}/${term.maxMarks}` : '-'}
                  </td>
                );
              })}
              {config.showPercentage !== false && (
                <td style={cellStyle()}>{row.overallPercentage}%</td>
              )}
              {config.showGrade !== false && (
                <td style={{ ...cellStyle(), fontWeight: 700, color: '#2563eb' }}>
                  {row.overallGrade ?? '-'}
                </td>
              )}
            </tr>
          ))}
          {config.showOverall !== false && data && (
            <tr style={{ background: '#f0f4f8', fontWeight: 700 }}>
              <td style={cellStyle(false, true)}>Total</td>
              {terms.map(t => {
                const obt = rows.reduce((s, r) => s + (r.terms[t]?.marksObtained ?? 0), 0);
                const max = rows.reduce((s, r) => s + (r.terms[t]?.maxMarks ?? 0), 0);
                return <td key={t} style={cellStyle()}>{obt}/{max}</td>;
              })}
              {config.showPercentage !== false && (
                <td style={cellStyle()}>{data.grandTotal.percentage}%</td>
              )}
              {config.showGrade !== false && (
                <td style={{ ...cellStyle(), color: '#2563eb' }}>{data.grandTotal.grade ?? '-'}</td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle(header = false, leftAlign = false): CSSProperties {
  return {
    border: '1px solid #ccc',
    padding: '4px 6px',
    textAlign: leftAlign ? 'left' : 'center',
    fontWeight: header ? 600 : undefined,
  };
}
