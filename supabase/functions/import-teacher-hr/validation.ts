export const COLUMNS = ['employee_id', 'full_name', 'email_address', 'date_of_joining', 'date_of_birth', 'gender', 'designation', 'department', 'qualification', 'experience_years', 'employment_type', 'status'] as const;
export type Column = typeof COLUMNS[number];
export type RawRow = { rowNumber: number; values: Partial<Record<Column, string>> };
export type ExistingTeacher = { id: string; email: string; name: string; role: string; user_id: string; updated_at: string; employee_id: string | null };
export type Issue = { rowNumber: number; field: string; problem: string; correction: string; severity: 'error' | 'warning' };
export type Updates = { name: string; date_of_joining?: string; date_of_birth?: string; gender?: string; designation?: string; department?: string; qualification?: string; experience_years?: number; employment_type?: string; employment_status?: string };
export type CheckedRow = RawRow & { teacher: ExistingTeacher | null; updates: Updates; issues: Issue[] };

export function validateRows(rows: RawRow[], teachers: ExistingTeacher[], today = new Date().toISOString().slice(0, 10)): CheckedRow[] {
  const emails = new Map<string, number>();
  rows.forEach(r => { const email = (r.values.email_address ?? '').trim().toLowerCase(); if (email) emails.set(email, (emails.get(email) ?? 0) + 1); });
  return rows.map(row => {
    const v = row.values;
    const issues: Issue[] = [];
    const add = (field: string, problem: string, correction: string, severity: 'error' | 'warning' = 'error') => issues.push({ rowNumber: row.rowNumber, field, problem, correction, severity });
    const email = (v.email_address ?? '').trim().toLowerCase();
    const matches = teachers.filter(t => t.email.trim().toLowerCase() === email);
    const teacher = matches.length === 1 ? matches[0] : null;
    const updates: Updates = { name: (v.full_name ?? '').trim() };
    if (!updates.name || updates.name.length > 200) add('full_name', 'Name is required and must be at most 200 characters.', 'Enter the teacher’s full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) add('email_address', 'A valid email is required.', 'Use the email of an existing school teacher.');
    if (/@(?:[^@.]+\.)*(?:example\.(?:com|net|org)|test|invalid|localhost)$/i.test(email)) add('email_address', 'Placeholder email cannot be linked.', 'Replace it with the existing teacher’s real email.');
    if ((emails.get(email) ?? 0) > 1) add('email_address', 'Duplicate email in workbook.', 'Keep one row per teacher.');
    if (matches.length > 1) add('email_address', 'Multiple school records match this email.', 'Resolve the duplicate school records before importing.');
    else if (!teacher || !teacher.user_id) add('email_address', 'No existing school teacher matches.', 'Complete Add User invitation acceptance first, then import.');
    else if (teacher.role !== 'teacher') add('email_address', 'Matching user is not a Teacher.', 'Only existing Teacher accounts can receive these HR updates.');
    if (v.employee_id?.trim()) add('employee_id', 'Spreadsheet Employee ID will be ignored.', 'Leave blank; the existing ID is preserved.', 'warning');
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
    return { ...row, teacher, updates, issues };
  });
}