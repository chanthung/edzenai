/**
 * Stage 2 — which existing teacher records may be offered for "Link an existing teacher".
 * UI filtering only; the server re-verifies school, role, link state and email identity.
 */
export interface LinkCandidate {
  id: string;
  name: string;
  email: string | null;
  employee_id: string | null;
  user_id: string | null;
  role: string;
  designation?: string | null;
  department?: string | null;
}

export function getLinkableTeachers<T extends LinkCandidate>(teachers: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return teachers
    .filter(t => t.user_id === null && (t.role ?? 'teacher') === 'teacher')
    .filter(t => !q
      || t.name.toLowerCase().includes(q)
      || (t.employee_id ?? '').toLowerCase().includes(q));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email the invitation must use: the saved email when present, else a valid entered one. */
export function resolveLinkInviteEmail(savedEmail: string | null, entered: string): string | null {
  const saved = savedEmail?.trim().toLowerCase();
  if (saved) return saved;
  const e = entered.trim().toLowerCase();
  return EMAIL_RE.test(e) && e.length <= 254 ? e : null;
}
