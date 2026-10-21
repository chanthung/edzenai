import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { COLUMNS, parseTeacherWorkbook, validateRows, type RawRow, type ExistingTeacher } from '@/lib/teacher-import';

const teacher: ExistingTeacher = { id: 'teacher', name: 'Existing', email: 'teacher@school.in', role: 'teacher', user_id: 'user', employee_id: 'EMP-0001', updated_at: '2026-01-01' };
const row = (values: RawRow['values'] = {}): RawRow => ({ rowNumber: 5, values: { full_name: 'Teacher', email_address: teacher.email, ...values } });
const errors = (r: RawRow, teachers = [teacher]) => validateRows([r], teachers, '2026-10-21')[0].issues.filter(i => i.severity === 'error');
const workbook = (grid: unknown[][]) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grid), 'Teachers'); return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }); };

describe('existing teacher import safeguards', () => {
  it('accepts a real existing teacher with valid HR details', () => expect(errors(row({ date_of_birth: '1990-05-01', date_of_joining: '2020-01-01', gender: 'Female', employment_type: 'Full-time', status: 'On leave', experience_years: '8' }))).toEqual([]));
  it('preserves blank values and never writes IDs, email, login or assignments', () => {
    const checked = validateRows([row({ employee_id: 'FAKE', department: '', status: 'inactive' })], [teacher])[0];
    expect(checked.updates).toEqual({ name: 'Teacher', employment_status: 'inactive' });
    expect(checked.teacher?.employee_id).toBe('EMP-0001');
  });
  it('blocks unmatched school records', () => expect(errors(row(), [])).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'email_address', problem: 'No existing school teacher matches.' })])));
  it('blocks accountants', () => expect(errors(row(), [{ ...teacher, role: 'accountant' }])).toEqual(expect.arrayContaining([expect.objectContaining({ problem: 'Matching user is not a Teacher.' })])));
  it('blocks ambiguous school-local emails', () => expect(errors(row(), [teacher, { ...teacher, id: 'second' }])).toEqual(expect.arrayContaining([expect.objectContaining({ problem: 'Multiple school records match this email.' })])));
  it('blocks duplicate workbook emails regardless of case', () => {
    const result = validateRows([row(), { ...row({ email_address: 'TEACHER@SCHOOL.IN' }), rowNumber: 6 }], [teacher]);
    expect(result.every(r => r.issues.some(i => i.problem === 'Duplicate email in workbook.'))).toBe(true);
  });
  it('blocks placeholder emails even when a record matches', () => expect(errors(row({ email_address: 'test@example.com' }), [{ ...teacher, email: 'test@example.com' }])).toEqual(expect.arrayContaining([expect.objectContaining({ problem: 'Placeholder email cannot be linked.' })])));
  it.each(['Librarian', 'Office Assistant'])('blocks unsupported designation %s', designation => expect(errors(row({ designation }))).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'designation' })])));
  it.each(['-1', '2.5', '71', '8 years'])('blocks invalid experience %s', experience_years => expect(errors(row({ experience_years }))).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'experience_years' })])));
  it.each(['0', '70'])('allows experience boundary %s', experience_years => expect(errors(row({ experience_years }))).toEqual([]));
  it.each(['2026-02-30', '2999-01-01', '12/01/1990'])('blocks invalid birth date %s', date_of_birth => expect(errors(row({ date_of_birth }))).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'date_of_birth' })])));
  it('blocks joining before birth', () => expect(errors(row({ date_of_birth: '1990-05-01', date_of_joining: '1989-01-01' }))).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'date_of_joining' })])));
  it('checks partial dates against preserved values', () => expect(errors(row({ date_of_joining: '1989-01-01' }), [{ ...teacher, date_of_birth: '1990-05-01' } as ExistingTeacher])).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'date_of_joining' })])));
  it.each([{ gender: 'unknown' }, { employment_type: 'permanent' }, { status: 'disabled' }])('blocks uncontrolled values %j', values => expect(errors(row(values))).not.toEqual([]));
  it('detects headers below title rows and preserves Excel row numbers', () => {
    const parsed = parseTeacherWorkbook(workbook([['Title'], ['Instructions'], [], [...COLUMNS], COLUMNS.map(c => row().values[c] ?? '')]));
    expect(parsed.rows[0].rowNumber).toBe(5); expect(parsed.issues).toEqual([]);
  });
  it('warns for unknown and missing optional columns', () => {
    const parsed = parseTeacherWorkbook(workbook([['full_name', 'email_address', 'phone'], ['Teacher', teacher.email, '123']]));
    expect(parsed.issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'phone', severity: 'warning' }), expect.objectContaining({ field: 'gender', severity: 'warning' })]));
    expect(parsed.rows[0].values).not.toHaveProperty('phone');
  });
  it('blocks missing required headers', () => expect(() => parseTeacherWorkbook(workbook([['full_name'], ['Teacher']]))).toThrow('both full_name and email_address'));
  it('ignores the approved field guide sheet', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['full_name', 'email_address'], ['Teacher', teacher.email]]), 'Teachers');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['full_name', 'Description'], ['email_address', 'Description']]), 'Field Guide');
    expect(parseTeacherWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })).rows).toHaveLength(1);
  });
});