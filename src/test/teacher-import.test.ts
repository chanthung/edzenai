import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseTeacherWorkbook, validateRows, previewOutcomes, summarizeOutcomes, type RawRow, type ExistingTeacher } from '@/lib/teacher-import';
const teacher: ExistingTeacher & { date_of_birth: string } = { id: 'teacher', name: 'Existing', email: 'teacher@school.in', role: 'teacher', user_id: 'user', employee_id: 'EMP-0001', updated_at: '2026-01-01', date_of_birth: '1990-05-01' };
const row = (values: RawRow['values'] = {}, rowNumber = 2): RawRow => ({ rowNumber, values: { full_name: 'New Teacher', ...values } });
const workbook = (grid: unknown[][]) => { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grid), 'Teachers'); return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }); };
const check = (values: RawRow['values'], teachers: ExistingTeacher[] = [teacher]) => validateRows([row(values)], teachers, '2026-10-21')[0];
describe('permissive incomplete teacher imports', () => {
  it('accepts a name-only record', () => expect(check({})).toMatchObject({ action: 'create', teacher: null, updates: {} }));
  it('stores unmatched valid email on an unlinked new record', () => expect(check({ email_address: 'NEW@school.in' })).toMatchObject({ action: 'create', teacher: null, values: { email_address: 'new@school.in' } }));
  it.each(['Principal', 'HOD', 'Head Teacher', 'Office Assistant', 'Librarian', ' Coordinator '])('preserves designation %s without role inference', designation => {
    expect(check({ designation })).toMatchObject({ action: 'create', updates: { designation } });
  });
  it('skips uninterpretable optional fields while keeping supported values', () => {
    const checked = check({ gender: 'unknown', experience_years: '8 years', date_of_birth: '2026-02-30', department: 'Science', qualification: 'M.Sc', employment_type: 'permanent', status: 'unknown' });
    expect(checked.action).toBe('create'); expect(checked.updates).toEqual({ department: 'Science', qualification: 'M.Sc' });
    expect(checked.issues.filter(i => i.severity === 'error')).toEqual([]);
  });
  it.each(['invalid', 'fake@example.com'])('skips unsafe optional email %s rather than inventing one', email_address => {
    expect(check({ email_address })).toMatchObject({ action: 'create', values: { email_address: '' } });
  });
  it('blank cells preserve existing HR values and account fields', () => {
    expect(check({ email_address: teacher.email ?? '', full_name: 'Another name', department: '', status: 'inactive', employee_id: 'custom' })).toMatchObject({ action: 'update', teacher: { id: 'teacher', employee_id: 'EMP-0001' }, updates: { employment_status: 'inactive' } });
  });
  it('matches null-email HR records by Employee ID', () => {
    expect(check({ employee_id: 'emp-0001', qualification: 'M.A' }, [{ ...teacher, email: null, user_id: null }])).toMatchObject({ action: 'update', teacher: { id: 'teacher' }, updates: { qualification: 'M.A' } });
  });
  it('ignores unmatched supplied Employee ID on creates', () => expect(check({ employee_id: 'SCHOOL-1' })).toMatchObject({ action: 'create', updates: {} }));
  it('blocks ambiguous matches', () => expect(check({ email_address: teacher.email ?? '' }, [teacher, { ...teacher, id: 'another' }]).action).toBeNull());
  it('blocks conflicting email and Employee ID matches', () => expect(check({ email_address: teacher.email ?? '', employee_id: 'EMP-0002' }, [teacher, { ...teacher, id: 'another', email: 'other@school.in', employee_id: 'EMP-0002' }]).action).toBeNull());
  it('skips potential name duplicates without merging or overwriting', () => {
    const checked = check({ full_name: 'Existing' }); expect(checked.action).toBeNull(); expect(checked.teacher).toBeNull();
  });
  it('skips duplicate workbook names needing review', () => expect(validateRows([row(), row({}, 3)], []).every(r => r.action === null)).toBe(true));
  it('skips duplicate case-insensitive email identifiers', () => expect(validateRows([row({ email_address: 'teacher@school.in' }), row({ email_address: 'TEACHER@school.in' }, 3)], [teacher]).every(r => r.action === null)).toBe(true));
  it('skips missing names without blocking other ready rows', () => {
    const checked = validateRows([row({ full_name: '' }), row({ full_name: 'Ready' }, 3)], []);
    expect(summarizeOutcomes(previewOutcomes(checked))).toMatchObject({ ready: 1, blocked: 1, created: 0 });
  });
  it('never overwrites an existing accountant', () => expect(check({ email_address: teacher.email ?? '' }, [{ ...teacher, role: 'accountant' }]).action).toBeNull());
  it('skips conflicting dates and preserves saved dates', () => expect(check({ employee_id: 'EMP-0001', date_of_joining: '1989-01-01', department: 'Arts' }).updates).toEqual({ department: 'Arts' }));
  it.each(['-1', '2.5', '71'])('skips invalid experience %s without blocking the record', experience_years => expect(check({ experience_years })).toMatchObject({ action: 'create', updates: {} }));
  it.each(['0', '70'])('accepts experience boundary %s', experience_years => expect(check({ experience_years }).updates).toEqual({ experience_years: Number(experience_years) }));
  it('accepts all complete supported HR values', () => expect(check({ date_of_birth: '1990-05-01', date_of_joining: '2020-01-01', gender: 'Female', employment_type: 'Full-time', status: 'On leave', experience_years: '8' }).updates).toEqual({ date_of_birth: '1990-05-01', date_of_joining: '2020-01-01', gender: 'female', employment_type: 'full_time', employment_status: 'on_leave', experience_years: 8 }));
});
describe('flexible workbook mapping', () => {
  it.each(['Name', 'Full Name', 'Teacher Name', 'full_name'])('maps %s without a template', name => expect(parseTeacherWorkbook(workbook([[name, 'Email Address', 'Department', 'Unfamiliar'], ['New', 'new@school.in', 'Science', 'ignored']])).rows[0].values).toEqual({ full_name: 'New', email_address: 'new@school.in', department: 'Science' }));
  it('maps unrecognized headers manually and permits skipping columns', () => {
    const parsed = parseTeacherWorkbook(workbook([['Person', 'Notes'], ['Someone', 'skip']]), ['full_name', null]);
    expect(parsed.rows[0].values).toEqual({ full_name: 'Someone' }); expect(parsed.issues[0].severity).toBe('warning');
  });
  it('returns unmapped headers so they can be reviewed', () => expect(parseTeacherWorkbook(workbook([['Person'], ['Someone']])).mapping).toEqual([null]));
  it('refuses ambiguous duplicate target mappings', () => expect(() => parseTeacherWorkbook(workbook([['Name', 'Teacher Name'], ['A', 'B']]))).toThrow('Map only one column'));
  it('retains Excel row numbers below titles', () => expect(parseTeacherWorkbook(workbook([['Title'], ['Name', 'Qualification'], ['A', 'M.A']])).rows[0].rowNumber).toBe(3));
  it('preserves designation spelling and whitespace', () => expect(parseTeacherWorkbook(workbook([['Name', 'Designation'], ['A', ' HOD ']])).rows[0].values.designation).toBe(' HOD '));
});
describe('actual save accounting', () => {
  it('counts only confirmed created and updated records', () => expect(summarizeOutcomes([{ rowNumber: 2, status: 'created', reasons: [] }, { rowNumber: 3, status: 'updated', reasons: [] }, { rowNumber: 4, status: 'blocked', reasons: ['ambiguous'] }, { rowNumber: 5, status: 'failed', reasons: ['failed'] }])).toMatchObject({ created: 1, updated: 1, blocked: 1, failed: 1, ready: 0 }));
});
