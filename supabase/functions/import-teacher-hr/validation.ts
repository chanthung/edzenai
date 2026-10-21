export const COLUMNS = ['employee_id', 'full_name', 'email_address', 'date_of_joining', 'date_of_birth', 'gender', 'designation', 'department', 'qualification', 'experience_years', 'employment_type', 'status'] as const;
export type Column = typeof COLUMNS[number];
export type RawRow = { rowNumber: number; values: Partial<Record<Column, string>> };
export type ExistingTeacher = { id: string; email: string | null; name: string; role: string; user_id: string | null; updated_at: string; employee_id: string | null };
export type Issue = { rowNumber: number; field: string; problem: string; correction: string; severity: 'error' | 'warning' };
export type Updates = { date_of_joining?: string; date_of_birth?: string; gender?: string; designation?: string; department?: string; qualification?: string; experience_years?: number; employment_type?: string; employment_status?: string };
// update: matched existing teacher (by email, or by Employee ID when email is blank)
// create: new HR-only record without a login account (email blank, no Employee ID match)
// invitation_required: valid email that matches no teacher in this school — use Add User instead
export type RowAction = 'update' | 'create' | 'invitation_required';
export type CheckedRow = RawRow & { teacher: ExistingTeacher | null; action: RowAction | null; updates: Updates; issues: Issue[] };
export type RowOutcome = { rowNumber: number; status: 'updated' | 'created' | 'blocked' | 'failed' | 'ready' | 'invitation_required'; reasons: string[] };
export type ImportResult = { imported: number; created: number; updated: number; blocked: number; failed: number; ready: number; invitationRequired: number; results: RowOutcome[]; error?: string };
export function summarizeOutcomes(results: RowOutcome[], error?: string): ImportResult {
  const count = (s: RowOutcome['status']) => results.filter(r => r.status === s).length;
  const created = count('created');
  return { imported: created, created, updated: count('updated'), blocked: count('blocked'),
    failed: count('failed'), ready: count('ready'), invitationRequired: count('invitation_required'), results, ...(error ? { error } : {}) };
}
export function previewOutcomes(rows: CheckedRow[]): RowOutcome[] {
  return rows.map(row => {
    const errors = row.issues.filter(i => i.severity === 'error');
    const status: RowOutcome['status'] = errors.length ? 'blocked' : row.action === 'invitation_required' ? 'invitation_required' : 'ready';
    return { rowNumber: row.rowNumber, status, reasons: errors.map(i => `${i.field}: ${i.problem} ${i.correction}`) };
  });
}

const normalizeEmail = (raw: string | undefined) => (raw ?? '').trim().toLowerCase();

export function validateRows(rows: RawRow[], teachers: ExistingTeacher[], today = new Date().toISOString().slice(0, 10)): CheckedRow[] {
  const emails = new Map<string, number>();
  const ids = new Map<string, number>();
  const names = new Map<string, number>();
  for (const row of rows) {
    for (const [map, value] of [[emails, normalizeEmail(row.values.email_address)], [ids, (row.values.employee_id ?? '').trim().toLowerCase()], [names, (row.values.full_name ?? '').trim().toLowerCase()]] as const) {
      if (value) map.set(value, (map.get(value) ?? 0) + 1);
    }
  }
  return rows.map(row => {
    const v = row.values;
    const issues: Issue[] = [];
    const add = (field: string, problem: string, correction: string, severity: 'error' | 'warning' = 'warning') => issues.push({ rowNumber: row.rowNumber, field, problem, correction, severity });
    const email = normalizeEmail(v.email_address);
    const name = (v.full_name ?? '').trim();
    const empId = (v.employee_id ?? '').trim().toLowerCase();
    let teacher: ExistingTeacher | null = null;
    let action: RowAction | null = 'create';
    const updates: Updates = {};
    if (!name || name.length > 200) add('full_name', 'Name is required and must be at most 200 characters.', 'Enter the staff member’s full name.', 'error');
    const validEmail = !email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 && !/@(?:[^@.]+\.)*(?:example\.(?:com|net|org)|test|invalid|localhost)$/i.test(email));
    if (!validEmail) add('email_address', 'Email cannot be interpreted and will be skipped.', 'Supply a real email later.');
    const emailMatches = validEmail && email ? teachers.filter(t => normalizeEmail(t.email ?? undefined) === email) : [];
    const idMatches = empId ? teachers.filter(t => (t.employee_id ?? '').trim().toLowerCase() === empId) : [];
    if (emailMatches.length > 1 || idMatches.length > 1) add('match', 'Multiple school records match this identifier.', 'Resolve the ambiguous match before importing this row.', 'error');
    if (emailMatches.length === 1 && idMatches.length === 1 && emailMatches[0].id !== idMatches[0].id) add('match', 'Email and Employee ID identify different people.', 'Correct the identifiers.', 'error');
    teacher = idMatches.length === 1 ? idMatches[0] : emailMatches.length === 1 ? emailMatches[0] : null;
    if (teacher) {
      action = 'update';
      if (teacher.role !== 'teacher') add('match', 'Matching user is not a Teacher.', 'Manage this existing account separately.', 'error');
    } else {
      if (empId) add('employee_id', 'Unmatched spreadsheet ID will be ignored.', 'A new Employee ID is generated automatically.');
      if (teachers.some(t => t.name.trim().toLowerCase() === name.toLowerCase()) || (names.get(name.toLowerCase()) ?? 0) > 1) add('full_name', 'Potential duplicate name needs review.', 'Supply the correct existing Employee ID or distinguish this person before importing.', 'error');
    }
    if ((email && (emails.get(email) ?? 0) > 1) || (empId && (ids.get(empId) ?? 0) > 1)) add('match', 'Duplicate identifier in workbook.', 'Keep one row per person.', 'error');
    if (!email) add('email_address', 'No email supplied.', 'Record remains without a login account unless already linked.');
    const date = (key: 'date_of_birth' | 'date_of_joining', earliest: string) => {
      const value = v[key]?.trim(); if (!value) return;
      const parsed = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value < earliest || (key === 'date_of_birth' && value > today)) add(key, 'Date cannot be interpreted and will be skipped.', 'Use a valid YYYY-MM-DD date later.');
      else updates[key] = value;
    };
    date('date_of_birth', '1930-01-01'); date('date_of_joining', '1950-01-01');
    const existing = teacher as (ExistingTeacher & { date_of_birth?: string | null; date_of_joining?: string | null }) | null;
    const birth = updates.date_of_birth ?? existing?.date_of_birth;
    const joining = updates.date_of_joining ?? existing?.date_of_joining;
    if (birth && joining && joining <= birth) {
      delete updates.date_of_birth; delete updates.date_of_joining;
      add('dates', 'Conflicting birth/joining dates will be skipped.', 'Joining must be after birth; existing dates are preserved.');
    }
    const controlled = (key: 'gender' | 'employment_type' | 'status', target: 'gender' | 'employment_type' | 'employment_status', allowed: string[]) => {
      const raw = v[key]?.trim(); if (!raw) return;
      const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_');
      if (!allowed.includes(normalized)) add(key, 'Unrecognized value will be skipped.', `Supported values: ${allowed.join(', ')}.`);
      else updates[target] = normalized;
    };
    controlled('gender', 'gender', ['male', 'female', 'other', 'prefer_not_to_say']);
    controlled('employment_type', 'employment_type', ['full_time', 'part_time', 'contractual', 'substitute']);
    controlled('status', 'employment_status', ['active', 'inactive', 'on_leave', 'resigned']);
    const experience = v.experience_years?.trim();
    if (experience) {
      if (!/^\d+$/.test(experience) || Number(experience) > 70) add('experience_years', 'Unrecognized experience will be skipped.', 'Use a whole number from 0 to 70 later.');
      else updates.experience_years = Number(experience);
    }
    for (const key of ['designation', 'department', 'qualification'] as const) {
      const value = v[key]; if (!value?.trim()) continue;
      if (value.length > (key === 'qualification' ? 200 : 100)) add(key, 'Text exceeds the field limit and will be skipped.', `Use at most ${key === 'qualification' ? 200 : 100} characters.`);
      else updates[key] = value;
    }
    if (issues.some(i => i.severity === 'error')) action = null;
    // Invalid optional emails never reach storage; existing account fields are never updated.
    return { ...row, values: { ...v, email_address: validEmail ? email : '' }, teacher, action, updates, issues };
  });
}
