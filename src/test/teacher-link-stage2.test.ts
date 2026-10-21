import { describe, it, expect } from 'vitest';
import { getLinkableTeachers, resolveLinkInviteEmail } from '@/lib/teacher-link-eligibility';
import { getAccountLinkStatus } from '@/lib/teacher-account-status';

const NOW = new Date('2026-10-21T00:00:00Z');
const future = '2026-10-28T00:00:00Z';
const past = '2026-10-01T00:00:00Z';

const base = { email: null, employee_id: null, designation: null, department: null };
const teachers = [
  { ...base, id: 't1', name: 'Asha Rao', employee_id: 'EMP-0004', user_id: null, role: 'teacher' },
  { ...base, id: 't2', name: 'Asha Rao', employee_id: 'EMP-0009', user_id: null, role: 'teacher', email: 'asha@x.com' },
  { ...base, id: 't3', name: 'Linked One', employee_id: 'EMP-0001', user_id: 'u1', role: 'teacher' },
  { ...base, id: 't4', name: 'Accounts', employee_id: 'EMP-0002', user_id: null, role: 'accountant' },
];

describe('Stage 2 link eligibility', () => {
  it('offers only unlinked Teacher records', () => {
    expect(getLinkableTeachers(teachers, '').map(t => t.id)).toEqual(['t1', 't2']);
  });
  it('searches by name and Employee ID', () => {
    expect(getLinkableTeachers(teachers, 'emp-0009').map(t => t.id)).toEqual(['t2']);
    expect(getLinkableTeachers(teachers, 'asha').map(t => t.id)).toEqual(['t1', 't2']);
    expect(getLinkableTeachers(teachers, 'linked')).toEqual([]);
  });
});

describe('Stage 2 invitation email', () => {
  it('uses the saved email when the record has one', () => {
    expect(resolveLinkInviteEmail(' Asha@X.com ', 'other@y.com')).toBe('asha@x.com');
  });
  it('accepts a valid new email when none is saved', () => {
    expect(resolveLinkInviteEmail(null, ' New@School.com ')).toBe('new@school.com');
  });
  it('rejects an invalid entered email', () => {
    expect(resolveLinkInviteEmail(null, 'not-an-email')).toBeNull();
    expect(resolveLinkInviteEmail('', '')).toBeNull();
  });
});

describe('Stage 2 status by target record', () => {
  it('shows pending for a targeted invite even without a saved email', () => {
    expect(getAccountLinkStatus({ id: 't1', user_id: null, email: null },
      [{ email: 'new@school.com', expires_at: future, target_teacher_id: 't1' }], NOW)).toBe('invitation_pending');
  });
  it('shows expired for an expired targeted invite', () => {
    expect(getAccountLinkStatus({ id: 't1', user_id: null, email: null },
      [{ email: 'new@school.com', expires_at: past, target_teacher_id: 't1' }], NOW)).toBe('invitation_expired');
  });
  it('a targeted invite for another record never matches by email', () => {
    expect(getAccountLinkStatus({ id: 't2', user_id: null, email: 'asha@x.com' },
      [{ email: 'asha@x.com', expires_at: future, target_teacher_id: 't1' }], NOW)).toBe('not_invited');
  });
  it('legacy invites still match by email', () => {
    expect(getAccountLinkStatus({ id: 't2', user_id: null, email: 'asha@x.com' },
      [{ email: 'asha@x.com', expires_at: future, target_teacher_id: null }], NOW)).toBe('invitation_pending');
  });
  it('linked is shown only from the persisted account link', () => {
    expect(getAccountLinkStatus({ id: 't1', user_id: 'u9', email: null },
      [{ email: 'a@b.com', expires_at: future, target_teacher_id: 't1' }], NOW)).toBe('linked');
  });
});
