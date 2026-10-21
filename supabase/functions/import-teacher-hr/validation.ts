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
  rows.forEach(r => { const email = normalizeEmail(r.values.email_address); if (email) emails.set(email, (emails.get(email) ?? 0) + 1); });
  const blankEmailNames = new Map<string, number>();
  rows.forEach(r => {
    if (normalizeEmail(r.values.email_address)) return;
    const name = (r.values.full_name ?? '').trim().toLowerCase();
    if (name) blankEmailNames.set(name, (blankEmailNames.get(name) ?? 0) + 1);
  });
  return rows.map(row => {
    const v = row.values;
    const issues: Issue[] = [];
    const add = (field: string, problem: string, correction: string, severity: 'error' | 'warning' = 'error') => issues.push({ rowNumber: row.rowNumber, field, problem, correction, severity });
    const email = normalizeEmail(v.email_address);
    const name = (v.full_name ?? '').trim();
    let teacher: ExistingTeacher | null = null;
    let action: RowAction | null = null;
    const updates: Updates = {};
    if (!name || name.length > 200) add('full_name', 'Name is required and must be at most 200 characters.', 'Enter the teacher’s full name.');
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) add('email_address', 'A valid email is required.', 'Use a valid school email, or leave it blank for an HR-only record.');
      if (/@(?:[^@.]+\.)*(?:example\.(?:com|net|org)|test|invalid|localhost)$/i.test(email)) add('email_address', 'Placeholder email cannot be linked.', 'Replace it with the teacher’s real email or leave it blank.');
      if ((emails.get(email) ?? 0) > 1) add('email_address', 'Duplicate email in workbook.', 'Keep one row per teacher.');
      const matches = teachers.filter(t => normalizeEmail(t.email ?? undefined) === email);
      if (matches.length > 1) add('email_address', 'Multiple school records match this email.', 'Resolve the duplicate school records before importing.');
      else if (matches.length === 1) {
        teacher = matches[0];
        if (teacher.role !== 'teacher') add('email_address', 'Matching user is not a Teacher.', 'Only existing Teacher records can receive these HR updates.');
        else if (!teacher.user_id) add('email_address', 'This record has no linked account yet.', 'Invite the teacher via Add User so the email links to their account.', 'warning');
        action = 'update';
        if (v.employee_id?.trim()) add('employee_id', 'Spreadsheet Employee ID will be ignored.', 'Leave blank; the existing ID is preserved.', 'warning');
      } else {
        action = 'invitation_required';
        add('email_address', 'No existing teacher matches this email.', 'Invite this teacher via Add User first; the import never creates login accounts.', 'warning');
      }
    } else {
      const empId = v.employee_id?.trim() ?? '';
      if (empId) {
        const matches = teachers.filter(t => (t.employee_id ?? '').trim().toLowerCase() === empId.toLowerCase());
        if (matches.length > 1) add('employee_id', 'Multiple school records match this Employee ID.', 'Resolve the duplicate records before importing.');
        else if (matches.length === 1) {
          teacher = matches[0];
          if (teacher.role !== 'teacher') add('employee_id', 'Matching user is not a Teacher.', 'Only existing Teacher records can receive these HR updates.');
          action = 'update';
        } else add('employee_id', 'No existing teacher matches this Employee ID.', 'Leave Employee ID blank to create a new record; IDs are system-generated.');
      } else {
        action = 'create';
        if ((blankEmailNames.get(name.toLowerCase()) ?? 0) > 1) add('full_name', 'Duplicate name in workbook.', 'Keep one row per teacher, or add distinct emails.', 'warning');
        const nameMatches = teachers.filter(t => t.name.trim().toLowerCase() === name.toLowerCase());
        if (nameMatches.length > 0) add('full_name', `A teacher named ${nameMatches[0].name} already exists (${nameMatches[0].employee_id ?? 'no ID'}).`, 'Review: add the matching Employee ID to update that record, or confirm this is a different person.', 'warning');
      }
    }
    const date = (key: 'date_of_birth' | 'date_of_joining', earliest: string) => {
      const value = v[key]?.trim(); if (!value) return;
      const parsed = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || value < earliest) add(key, 'Invalid date.', 'Use a valid YYYY-MM-DD date.');
      else if (key === 'date_of_birth' && value > today) add(key, 'Birth date is in the future.', 'Enter a past birth date.');
      else updates[key] = value;
    };
    date('date_of_birth', '1930-01-01'); date('date_of_joining', '1950-01-01');
    // Compare against preserved dates too, so partial updates cannot create invalid combinations.
    const existing = teacher as (ExistingTeacher & { date_of_birth?: string | null; date_of_joining?: string | null }) | null;
    const birth = updates.date_of_birth ?? existing?.date_of_birth;
    const joining = updates.date_of_joining ?? existing?.date_of_joining;
    if (birth && joining && joining <= birth) add('date_of_joining', 'Joining date must be after birth date.', 'Correct the joining or birth date.');
    const controlled = (key: 'gender' | 'employment_type' | 'status', target: 'gender' | 'employment_type' | 'employment_status', allowed: string[]) => {
      const raw = v[key]?.trim(); if (!raw) return;
      const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_');
      if (!allowed.includes(normalized)) add(key, 'Unsupported value.', `Use ${allowed.join(', ')}.`);
      else updates[target] = normalized;
    };
    controlled('gender', 'gender', ['male', 'female', 'other', 'prefer_not_to_say']);
    controlled('employment_type', 'employment_type', ['full_time', 'part_time', 'contractual', 'substitute']);
    controlled('status', 'employment_status', ['active', 'inactive', 'on_leave', 'resigned']);
    const experience = v.experience_years?.trim();
    if (experience) {
      if (!/^\d+$/.test(experience) || Number(experience) > 70) add('experience_years', 'Experience must be a whole number from 0 to 70.', 'Enter 0–70 without words or decimals.');
      else updates.experience_years = Number(experience);
    }
    for (const key of ['designation', 'department', 'qualification'] as const) {
      const value = v[key]?.trim(); if (!value) continue;
      if (value.length > (key === 'qualification' ? 200 : 100)) add(key, 'Text exceeds the field limit.', `Shorten to ${key === 'qualification' ? 200 : 100} characters.`);
      else updates[key] = value;
    }
    if (/\b(librarian|office|assistant librarian|accountant|clerk|receptionist|driver|security|cleaner|peon|nurse|non[ -]?teaching|administrator|principal|headmaster|headmistress|counsell?or)\b/i.test(v.designation ?? '')) add('designation', 'Designation may indicate an unsupported non-teaching role.', 'Review this staff record separately; do not import it as Teacher.');
    if (issues.some(i => i.severity === 'error')) action = null;
    return { ...row, teacher, action, updates, issues };
  });
}
