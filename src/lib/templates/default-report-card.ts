import type { CanvasElementNode } from './types';

let _i = 0;
const id = () => `el_${Date.now()}_${++_i}`;

export const DEFAULT_REPORT_CARD_ELEMENTS: CanvasElementNode[] = [
  // School name header
  {
    id: id(),
    type: 'field',
    field: '{school_name}',
    x: 60, y: 40, w: 674, h: 40,
    style: { fontSize: 24, fontWeight: 700, align: 'center', color: '#111111' },
  },
  {
    id: id(),
    type: 'field',
    field: '{school_address}',
    x: 60, y: 82, w: 674, h: 22,
    style: { fontSize: 12, align: 'center', color: '#555555' },
  },
  {
    id: id(),
    type: 'text',
    text: 'PROGRESS REPORT CARD',
    x: 60, y: 110, w: 674, h: 28,
    style: { fontSize: 14, fontWeight: 600, align: 'center', color: '#333333' },
  },
  {
    id: id(),
    type: 'line',
    x: 60, y: 145, w: 674, h: 2,
    style: { bgColor: '#111111' },
  },

  // Student info
  { id: id(), type: 'text', text: 'Name:', x: 60, y: 170, w: 60, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{student_name}', x: 125, y: 170, w: 240, h: 22, style: { fontSize: 12 } },
  { id: id(), type: 'text', text: 'Class:', x: 400, y: 170, w: 60, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{class_section}', x: 460, y: 170, w: 274, h: 22, style: { fontSize: 12 } },

  { id: id(), type: 'text', text: 'Roll No:', x: 60, y: 196, w: 60, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{roll_number}', x: 125, y: 196, w: 240, h: 22, style: { fontSize: 12 } },
  { id: id(), type: 'text', text: 'Year:', x: 400, y: 196, w: 60, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{academic_year}', x: 460, y: 196, w: 274, h: 22, style: { fontSize: 12 } },

  // Marks table
  {
    id: id(),
    type: 'marks_table',
    x: 60, y: 240, w: 674, h: 320,
    tableConfig: { showGrade: true, showPercentage: true, showOverall: true },
  },

  // Totals
  { id: id(), type: 'text', text: 'Percentage:', x: 60, y: 580, w: 100, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{percentage}', x: 165, y: 580, w: 120, h: 22, style: { fontSize: 12, fontWeight: 700, color: '#2563eb' } },
  { id: id(), type: 'text', text: 'Grade:', x: 320, y: 580, w: 60, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{grade}', x: 385, y: 580, w: 80, h: 22, style: { fontSize: 12, fontWeight: 700, color: '#2563eb' } },
  { id: id(), type: 'text', text: 'Attendance:', x: 500, y: 580, w: 100, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{attendance_percentage}', x: 605, y: 580, w: 100, h: 22, style: { fontSize: 12 } },

  // Remarks
  { id: id(), type: 'text', text: 'Teacher Remarks:', x: 60, y: 630, w: 130, h: 22, style: { fontSize: 12, fontWeight: 600 } },
  { id: id(), type: 'field', field: '{teacher_remarks}', x: 60, y: 655, w: 674, h: 50, style: { fontSize: 11, color: '#333333' } },

  // Signatures
  { id: id(), type: 'signature_line', signatureLabel: 'Class Teacher', x: 60, y: 1000, w: 180, h: 40, style: { fontSize: 11 } },
  { id: id(), type: 'signature_line', signatureLabel: 'Parent / Guardian', x: 307, y: 1000, w: 180, h: 40, style: { fontSize: 11 } },
  { id: id(), type: 'signature_line', signatureLabel: 'Principal', x: 554, y: 1000, w: 180, h: 40, style: { fontSize: 11 } },
];
