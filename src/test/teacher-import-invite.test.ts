import { describe, it, expect } from 'vitest';
import { canInviteExistingHrRecord } from '../../supabase/functions/create-user-invite/hr-record-compatibility';
describe('Add User compatibility with imported email records', () => {
  const hr = { user_id: null, name: 'Staff Member', role: 'teacher' };
  it('permits an explicit invitation for one matching unlinked teacher', () => expect(canInviteExistingHrRecord([hr], ' staff member ', 'teacher')).toBe(true));
  it('keeps linked accounts blocked', () => expect(canInviteExistingHrRecord([{ ...hr, user_id: 'account' }], hr.name, 'teacher')).toBe(false));
  it('rejects ambiguous school email records', () => expect(canInviteExistingHrRecord([hr, hr], hr.name, 'teacher')).toBe(false));
  it('rejects mismatched identity', () => expect(canInviteExistingHrRecord([hr], 'Other Person', 'teacher')).toBe(false));
  it('cannot convert an imported designation into another role', () => expect(canInviteExistingHrRecord([hr], hr.name, 'accountant')).toBe(false));
  it('retains the normal invitation path for a new email', () => expect(canInviteExistingHrRecord([], 'New', 'teacher')).toBe(true));
});