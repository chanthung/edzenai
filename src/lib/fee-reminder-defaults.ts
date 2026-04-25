export type ReminderKey = 'before_7d' | 'before_3d' | 'on' | 'after_1d' | 'after_7d';

export const REMINDER_LABELS: Record<ReminderKey, string> = {
  before_7d: '7 days before due',
  before_3d: '3 days before due',
  on: 'On due date',
  after_1d: '1 day after due (overdue)',
  after_7d: '7 days after due (final)',
};

export const REMINDER_ORDER: ReminderKey[] = ['before_7d', 'before_3d', 'on', 'after_1d', 'after_7d'];

export const DEFAULT_TEMPLATES: Record<ReminderKey, string> = {
  before_7d: `📅 Friendly reminder: ₹{amount} for {studentName} is due in 1 week on {dueDate}.\n\nView & pay here:\n{parentLink}\n\n- {schoolName}`,
  before_3d: `⏰ Reminder: ₹{amount} for {studentName} is due in 3 days on {dueDate}.\n\nPay here:\n{parentLink}\n\n- {schoolName}`,
  on: `⚠️ ₹{amount} for {studentName} is due today.\n\nPay now:\n{parentLink}\n\n- {schoolName}`,
  after_1d: `🔴 ₹{amount} for {studentName} is overdue (was due yesterday).\n\nPlease pay at:\n{parentLink}\n\n- {schoolName}`,
  after_7d: `🔴 Final reminder: ₹{amount} for {studentName} is 1 week overdue.\n\nPlease pay immediately:\n{parentLink}\n\n- {schoolName}`,
};

export const PLACEHOLDERS = ['{amount}', '{studentName}', '{dueDate}', '{parentLink}', '{schoolName}'];

export function renderPreview(tpl: string): string {
  return tpl
    .replaceAll('{amount}', '5,000')
    .replaceAll('{studentName}', 'Aarav Sharma')
    .replaceAll('{dueDate}', new Date().toLocaleDateString('en-IN'))
    .replaceAll('{parentLink}', 'https://www.edzenai.com/view/aarav/sample')
    .replaceAll('{schoolName}', 'Stepping Stones School');
}
