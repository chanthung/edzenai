// HR imports never grant account access. An explicit Add User invitation can
// reuse only one unlinked record whose identity and supported role agree.
export function canInviteExistingHrRecord(records: { user_id: string | null; name: string; role: string }[], name: string, role: string): boolean {
  return records.length === 0 || (records.length === 1 && records[0].user_id === null
    && records[0].name.trim().toLowerCase() === name.trim().toLowerCase()
    && records[0].role === role);
}