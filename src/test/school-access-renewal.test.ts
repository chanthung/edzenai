import { describe, expect, it } from 'vitest';
import { renewalLifecycleUpdate } from '@/lib/school-access-renewal';

describe('explicit paid-access renewal', () => {
  it('aligns lifecycle to the confirmed paid-access date', () => {
    expect(renewalLifecycleUpdate('active', '2027-12-29', '2026-05-29')).toEqual({ expiry_anchor_date: '2027-12-29', terminated_at: null });
  });
  it('does not extend access for invoice-only edits', () => {
    expect(renewalLifecycleUpdate('active', '2026-05-29', '2026-05-29')).toEqual({});
  });
  it('does not clear termination without a paid active renewal', () => {
    expect(renewalLifecycleUpdate('inactive', '2027-12-29', '2026-05-29')).toEqual({});
  });
});