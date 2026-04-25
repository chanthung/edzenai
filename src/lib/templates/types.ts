export type ElementType =
  | 'text'
  | 'field'
  | 'image'
  | 'line'
  | 'box'
  | 'marks_table'
  | 'signature_line';

export interface ElementStyle {
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  italic?: boolean;
  underline?: boolean;
}

export interface CanvasElementNode {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  field?: string;
  src?: string;
  style?: ElementStyle;
  tableConfig?: {
    showGrade?: boolean;
    showPercentage?: boolean;
    showRank?: boolean;
    showOverall?: boolean;
  };
  signatureLabel?: string;
}

export type PaperSize = 'A4' | 'A5' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

export interface DocumentTemplate {
  id?: string;
  school_id?: string;
  doc_type: 'report_card';
  name: string;
  is_default: boolean;
  paper_size: PaperSize;
  orientation: Orientation;
  margins: { top: number; right: number; bottom: number; left: number };
  elements: CanvasElementNode[];
}

// A4 in CSS pixels at 96dpi
export const PAPER_DIMENSIONS: Record<PaperSize, { w: number; h: number }> = {
  A4: { w: 794, h: 1123 },
  A5: { w: 559, h: 794 },
  Letter: { w: 816, h: 1056 },
};

export function getCanvasSize(paper: PaperSize, orientation: Orientation) {
  const { w, h } = PAPER_DIMENSIONS[paper];
  return orientation === 'portrait' ? { w, h } : { w: h, h: w };
}
