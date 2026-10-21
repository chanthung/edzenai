/** Invoice schedules are independent of paid-access expiry. */
export function renewalLifecycleUpdate(status: string, renewalDate: string | null, previousRenewalDate: string | null) {
  if (status !== 'active' || !renewalDate || renewalDate === previousRenewalDate) return {};
  return { expiry_anchor_date: renewalDate, terminated_at: null };
}