/**
 * Normalize Indian phone numbers to a 10-digit local format for storage.
 * Strips country code 91 (when length is 12), leading 0 (when length is 11),
 * and all non-digit characters.
 *
 * Display chrome (e.g. "+91 ") should be added at render time, never stored.
 */
export function normalizeIndianPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isValidIndianPhone(raw: string | null | undefined): boolean {
  const n = normalizeIndianPhone(raw);
  return n.length === 10 && /^[6-9]/.test(n);
}
