import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { TEACHER_DOWNLOAD_HEADERS, teacherExportRows, teacherExportBlob } from '@/lib/teacher-downloads';
import { matchTeacherHeader, parseTeacherWorkbook, validateRows } from '@/lib/teacher-import';
import type { Teacher } from '@/hooks/useTeachers';

const teacher: Teacher = { id: 'private-id', school_id: 'school-a', user_id: null, name: 'Saved Teacher', email: null, employee_id: 'EMP-0042', role: 'teacher', is_active: false, created_at: '', updated_at: '', gender: 'female', qualification: 'M.Ed', experience_years: 0, employment_type: 'part_time', employment_status: 'on_leave' };
describe('teacher downloads', () => {
  it('uses exactly the twelve supported import fields without manual mapping', () => {
    expect(TEACHER_DOWNLOAD_HEADERS.map(matchTeacherHeader)).toEqual(['full_name', 'email_address', 'employee_id', 'date_of_birth', 'gender', 'date_of_joining', 'experience_years', 'designation', 'department', 'qualification', 'employment_type', 'status']);
  });
  it('imports a completed two-sheet template with only Full Name supplied', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['EdZen AI instructions']]), 'Read Me');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[...TEACHER_DOWNLOAD_HEADERS], ['New Teacher']]), 'Teacher Data');
    const parsed = parseTeacherWorkbook(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
    expect(parsed.rows).toHaveLength(1);
    const checked = validateRows(parsed.rows, []);
    expect(checked[0].action).toBe('create');
    expect(checked[0].issues.filter(issue => issue.severity === 'error')).toEqual([]);
  });
  it('exports saved HR-only records, empty optional cells and exact Employee IDs, without identifiers', () => {
    const rows = teacherExportRows([teacher], 'school-a');
    expect(rows).toEqual([['Saved Teacher', '', 'EMP-0042', '', 'female', '', 0, '', '', 'M.Ed', 'part_time', 'on_leave', 'Not invited']]);
    expect(JSON.stringify(rows)).not.toContain('private-id');
    expect(JSON.stringify(rows)).not.toContain('school-a');
  });
  it('fails closed on another school even when other rows belong to the current school', () => {
    expect(() => teacherExportRows([teacher, { ...teacher, school_id: 'school-b' }], 'school-a')).toThrow('confirmed for this school');
    expect(() => teacherExportRows([teacher], '')).toThrow();
  });
  it('omits accountants and refuses an empty export', () => {
    expect(teacherExportRows([{ ...teacher, role: 'accountant' }], 'school-a')).toEqual([]);
    expect(() => teacherExportBlob([], 'school-a')).toThrow('No teacher records');
  });
  it('exports account access separately from HR employment status', () => {
    expect(teacherExportRows([{ ...teacher, user_id: 'hidden-account', is_active: true, employment_status: 'resigned' }], 'school-a')[0].slice(-2)).toEqual(['resigned', 'Active']);
  });
});