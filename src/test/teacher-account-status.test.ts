import { describe, it, expect } from 'vitest';
import { getAccountLinkStatus, ACCOUNT_STATUS_LABEL } from '@/lib/teacher-account-status';

const NOW = new Date('2026-10-21T00:00:00Z');
const future = '2026-10-28T00:00:00Z';
const past = '2026-10-01T00:00:00Z';

describe('getAccountLinkStatus', () => {
  it('reports linked when user_id is set, regardless of invites', () => {
    expect(getAccountLinkStatus(
      { user_id: 'u1', email: 'a@school.com' },
      [{ email: 'a@school.com', expires_at: future }],
      NOW,
    )).toBe('linked');
  });

  it('reports not_invited for HR-only record with no email', () => {
    expect(getAccountLinkStatus({ user_id: null, email: null }, [], NOW)).toBe('not_invited');
  });

  it('reports not_invited when no invite matches the teacher email', () => {
    expect(getAccountLinkStatus(
      { user_id: null, email: 'a@school.com' },
      [{ email: 'other@school.com', expires_at: future }],
      NOW,
    )).toBe('not_invited');
  });

  it('reports invitation_pending for a matching unexpired invite (case-insensitive email)', () => {
    expect(getAccountLinkStatus(
      { user_id: null, email: 'A@School.com' },
      [{ email: 'a@school.com', expires_at: future }],
      NOW,
    )).toBe('invitation_pending');
  });

  it('reports invitation_expired for a matching expired invite', () => {
    expect(getAccountLinkStatus(
      { user_id: null, email: 'a@school.com' },
      [{ email: 'a@school.com', expires_at: past }],
      NOW,
    )).toBe('invitation_expired');
  });

  it('has a label for every status', () => {
    for (const s of ['linked', 'invitation_pending', 'invitation_expired', 'not_invited'] as const) {
      expect(ACCOUNT_STATUS_LABEL[s]).toBeTruthy();
    }
  });
});
