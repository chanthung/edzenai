import * as XLSX from 'xlsx';
import { COLUMNS, type Column, type RawRow, type Issue } from '../../supabase/functions/import-teacher-hr/validation';
export { COLUMNS, validateRows, previewOutcomes, summarizeOutcomes } from '../../supabase/functions/import-teacher-hr/validation';
export type { RawRow, Issue, CheckedRow, ExistingTeacher, ImportResult, RowOutcome } from '../../supabase/functions/import-teacher-hr/validation';

export function parseTeacherWorkbook(buffer: ArrayBuffer): { rows: RawRow[]; issues: Issue[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const candidates: { grid: unknown[][]; header: number; names: string[] }[] = [];
  for (const name of workbook.SheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: true, defval: '' });
    const header = grid.findIndex(row => {
      const labels = row.map(v => String(v).trim().toLowerCase());
      return labels.includes('full_name');
    });
    if (header >= 0) candidates.push({ grid, header, names: grid[header].map(v => String(v).trim().toLowerCase()) });
  }
  if (!candidates.length) throw new Error('Use one teacher data sheet with a full_name header.');
  // When several sheets carry a full_name header (e.g. the approved Field Guide), the data sheet is the one with the most recognized columns.
  const scored = candidates.map(c => ({ ...c, score: c.names.filter(n => COLUMNS.includes(n as Column)).length }));
  const best = Math.max(...scored.map(c => c.score));
  const top = scored.filter(c => c.score === best);
  if (top.length !== 1) throw new Error('Use one teacher data sheet with a full_name header.');
  const { grid, header, names } = top[0];
  const issues: Issue[] = [];
  const issue = (field: string, problem: string, severity: 'error' | 'warning') => issues.push({ rowNumber: header + 1, field, problem, correction: 'Use the approved teacher template.', severity });
  for (const name of names.filter(Boolean)) {
    if (!COLUMNS.includes(name as Column)) issue(name, 'Unknown column will not be imported.', 'warning');
    if (names.filter(n => n === name).length > 1) issue(name, 'Duplicate column header.', 'error');
  }
  for (const name of COLUMNS) if (!names.includes(name)) issue(name, name === 'email_address' ? 'Email column is missing; rows will be imported as HR-only records without login accounts.' : 'Expected column is missing.', name === 'full_name' ? 'error' : 'warning');
  const rows: RawRow[] = [];
  grid.slice(header + 1).forEach((cells, index) => {
    if (!cells.some(v => String(v ?? '').trim())) return;
    const values: RawRow['values'] = {};
    names.forEach((name, column) => {
      if (!COLUMNS.includes(name as Column)) return;
      const cell = cells[column];
      let value = String(cell ?? '').trim();
      if ((name === 'date_of_birth' || name === 'date_of_joining') && typeof cell === 'number') {
        const d = XLSX.SSF.parse_date_code(cell, { date1904: workbook.Workbook?.WBProps?.date1904 });
        value = d ? `${String(d.y).padStart(4, '0')}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : value;
      }
      values[name as Column] = value;
    });
    rows.push({ rowNumber: header + index + 2, values });
  });
  if (!rows.length) throw new Error('No teacher records found.');
  if (rows.length > 500) throw new Error('Import at most 500 teacher records at a time.');
  return { rows, issues };
}