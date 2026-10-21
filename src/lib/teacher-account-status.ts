/**
 * Account-linking status for a teacher record.
 *
 * Derived only from persisted state:
 * - `school_teachers.user_id` — a linked login account (set on invite acceptance).
 * - `user_invites` rows with `accepted_at IS NULL` — outstanding invitations,
 *   matched to a teacher by exact normalized email.
 *
 * Limitation: an HR-only record with no email cannot be matched to an invite,
 * so it always reports "not_invited" even if an invite exists for that person
 * under a different/unsaved email.
 */
export type AccountLinkStatus =
  | 'linked'
  | 'invitation_pending'
  | 'invitation_expired'
  | 'not_invited';

export interface AccountStatusTeacher {
  user_id: string | null;
  email: string | null;
}

export interface AccountStatusInvite {
  email: string;
  expires_at: string;
}

export function getAccountLinkStatus(
  teacher: AccountStatusTeacher,
  pendingInvites: AccountStatusInvite[],
  now: Date = new Date(),
): AccountLinkStatus {
  if (teacher.user_id) return 'linked';
  const email = teacher.email?.trim().toLowerCase();
  if (!email) return 'not_invited';
  const invite = pendingInvites.find(i => i.email.trim().toLowerCase() === email);
  if (!invite) return 'not_invited';
  return new Date(invite.expires_at) < now ? 'invitation_expired' : 'invitation_pending';
}

export const ACCOUNT_STATUS_LABEL: Record<AccountLinkStatus, string> = {
  linked: 'Account linked',
  invitation_pending: 'Invitation pending',
  invitation_expired: 'Invitation expired',
  not_invited: 'Not invited',
};
