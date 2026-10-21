import * as XLSX from 'xlsx';
import { COLUMNS, type Column, type RawRow, type Issue } from '../../supabase/functions/import-teacher-hr/validation';
export { COLUMNS, validateRows, previewOutcomes, summarizeOutcomes } from '../../supabase/functions/import-teacher-hr/validation';
export type { RawRow, Issue, CheckedRow, ExistingTeacher, ImportResult, RowOutcome } from '../../supabase/functions/import-teacher-hr/validation';
export type ColumnMapping = (Column | null)[];
const aliases: Record<string, Column> = {
  name: 'full_name', full_name: 'full_name', teacher_name: 'full_name', staff_name: 'full_name',
  email: 'email_address', email_address: 'email_address', employee_id: 'employee_id', emp_id: 'employee_id',
  joining_date: 'date_of_joining', dob: 'date_of_birth', birth_date: 'date_of_birth',
  experience: 'experience_years', employment_status: 'status',
};
export function matchTeacherHeader(value: string): Column | null {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return COLUMNS.includes(key as Column) ? key as Column : aliases[key] ?? null;
}
export function parseTeacherWorkbook(buffer: ArrayBuffer, mappingOverride?: ColumnMapping): { rows: RawRow[]; issues: Issue[]; headers: string[]; mapping: ColumnMapping } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const candidates = workbook.SheetNames.map(name => {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: true, defval: '' });
    const named = grid.findIndex(row => row.some(v => matchTeacherHeader(String(v)) === 'full_name'));
    const header = named >= 0 ? named : grid.findIndex(row => row.some(v => String(v ?? '').trim()));
    const headers = (grid[header] ?? []).map(v => String(v ?? '').trim());
    return { grid, header, headers, score: headers.filter(v => matchTeacherHeader(v)).length };
  }).filter(c => c.header >= 0);
  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0];
  if (!selected) throw new Error('No data found in workbook.');
  if (candidates[1]?.score === selected.score) throw new Error('Use one staff data sheet; multiple sheets are equally likely.');
  const { grid, header, headers } = selected;
  const mapping = mappingOverride ?? headers.map(matchTeacherHeader);
  const issues: Issue[] = [];
  for (const field of COLUMNS) {
    if (mapping.filter(c => c === field).length > 1) throw new Error(`Map only one column to ${field}, and skip the others.`);
  }
  headers.forEach((name, index) => { if (!mapping[index]) issues.push({ rowNumber: header + 1, field: name || `Column ${index + 1}`, problem: 'Column is skipped.', correction: 'Map it to a supported field if needed.', severity: 'warning' }); });
  const rows: RawRow[] = [];
  grid.slice(header + 1).forEach((cells, index) => {
    if (!cells.some(v => String(v ?? '').trim())) return;
    const values: RawRow['values'] = {};
    mapping.forEach((name, column) => {
      if (!name) return;
      const cell = cells[column];
      let value = String(cell ?? '');
      if ((name === 'date_of_birth' || name === 'date_of_joining') && typeof cell === 'number') {
        const d = XLSX.SSF.parse_date_code(cell, { date1904: workbook.Workbook?.WBProps?.date1904 });
        value = d ? `${String(d.y).padStart(4, '0')}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : value;
      }
      values[name] = value;
    });
    rows.push({ rowNumber: header + index + 2, values });
  });
  if (!rows.length) throw new Error('No staff records found.');
  if (rows.length > 500) throw new Error('Import at most 500 staff records at a time.');
  return { rows, issues, headers, mapping };
}
