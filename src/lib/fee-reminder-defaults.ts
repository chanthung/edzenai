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
  const r = (s: string, a: string, b: string) => s.split(a).join(b);
  let out = tpl;
  out = r(out, '{amount}', '5,000');
  out = r(out, '{studentName}', 'Aarav Sharma');
  out = r(out, '{dueDate}', new Date().toLocaleDateString('en-IN'));
  out = r(out, '{parentLink}', 'https://www.edzenai.com/view/aarav/sample');
  out = r(out, '{schoolName}', 'Stepping Stones School');
  return out;
}
