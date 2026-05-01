// Localized templates for WhatsApp messages sent to parents.
// Keep these as plain text (Mayavi sends free-form messages — no template approval).

export type ParentLang = 'en' | 'hi' | 'as' | 'bn';

export function isSupportedParentLang(v: unknown): v is ParentLang {
  return v === 'en' || v === 'hi' || v === 'as' || v === 'bn';
}

interface ParentLinkVars {
  studentName: string;
  parentLink: string;
  schoolName: string;
}

export function parentLinkMessage(lang: ParentLang, v: ParentLinkVars): string {
  switch (lang) {
    case 'hi':
      return `नमस्ते,\n\n${v.studentName} का अभिभावक पोर्टल तैयार है। शुल्क, उपस्थिति और प्रगति यहाँ देखें:\n${v.parentLink}\n\n- ${v.schoolName}`;
    case 'as':
      return `নমস্কাৰ,\n\n${v.studentName}ৰ অভিভাৱক প’ৰ্টেল প্ৰস্তুত। মাচুল, উপস্থিতি আৰু প্ৰগতি ইয়াত চাওক:\n${v.parentLink}\n\n- ${v.schoolName}`;
    case 'bn':
      return `নমস্কার,\n\n${v.studentName}-এর অভিভাবক পোর্টাল প্রস্তুত। ফি, উপস্থিতি ও অগ্রগতি এখানে দেখুন:\n${v.parentLink}\n\n- ${v.schoolName}`;
    case 'en':
    default:
      return `Hello,\n\n${v.studentName}'s parent portal is ready. View fees, attendance & progress here:\n${v.parentLink}\n\n- ${v.schoolName}`;
  }
}

interface ReminderVars {
  studentName: string;
  amount: string;
  dueDate: string;
  parentLink: string;
  schoolName: string;
}

/**
 * Used as a fallback when the school's admin-configured English template
 * isn't desired (we still default to admin templates for English; this is
 * for parents who picked HI/AS/BN).
 */
export function reminderMessage(lang: ParentLang, kind: 'before' | 'on' | 'after', v: ReminderVars): string {
  if (lang === 'en') {
    if (kind === 'before') return `📅 Reminder: ₹${v.amount} for ${v.studentName} is due on ${v.dueDate}.\n\nPay here:\n${v.parentLink}\n\n- ${v.schoolName}`;
    if (kind === 'on') return `⚠️ ₹${v.amount} for ${v.studentName} is due today.\n\nPay now:\n${v.parentLink}\n\n- ${v.schoolName}`;
    return `🔴 ₹${v.amount} for ${v.studentName} is overdue (was due ${v.dueDate}).\n\nPlease pay:\n${v.parentLink}\n\n- ${v.schoolName}`;
  }
  if (lang === 'hi') {
    if (kind === 'before') return `📅 स्मरण: ${v.studentName} के लिए ₹${v.amount} ${v.dueDate} को देय है。\n\nयहाँ भुगतान करें:\n${v.parentLink}\n\n- ${v.schoolName}`;
    if (kind === 'on') return `⚠️ ${v.studentName} के लिए ₹${v.amount} आज देय है。\n\nअभी भुगतान करें:\n${v.parentLink}\n\n- ${v.schoolName}`;
    return `🔴 ${v.studentName} के लिए ₹${v.amount} बकाया है (देय तिथि ${v.dueDate})。\n\nकृपया भुगतान करें:\n${v.parentLink}\n\n- ${v.schoolName}`;
  }
  if (lang === 'as') {
    if (kind === 'before') return `📅 স্মৰণ: ${v.studentName}ৰ বাবে ₹${v.amount} ${v.dueDate} তাৰিখে দেয়。\n\nইয়াত পৰিশোধ কৰক:\n${v.parentLink}\n\n- ${v.schoolName}`;
    if (kind === 'on') return `⚠️ ${v.studentName}ৰ বাবে ₹${v.amount} আজি দেয়。\n\nএতিয়াই পৰিশোধ কৰক:\n${v.parentLink}\n\n- ${v.schoolName}`;
    return `🔴 ${v.studentName}ৰ বাবে ₹${v.amount} অতিদেয় (দেয় তাৰিখ আছিল ${v.dueDate})。\n\nঅনুগ্ৰহ কৰি পৰিশোধ কৰক:\n${v.parentLink}\n\n- ${v.schoolName}`;
  }
  // bn
  if (kind === 'before') return `📅 স্মরণ: ${v.studentName}-এর জন্য ₹${v.amount} ${v.dueDate} তারিখে দেয়。\n\nএখানে পরিশোধ করুন:\n${v.parentLink}\n\n- ${v.schoolName}`;
  if (kind === 'on') return `⚠️ ${v.studentName}-এর জন্য ₹${v.amount} আজ দেয়。\n\nএখনই পরিশোধ করুন:\n${v.parentLink}\n\n- ${v.schoolName}`;
  return `🔴 ${v.studentName}-এর জন্য ₹${v.amount} বকেয়া (দেয় ছিল ${v.dueDate})。\n\nঅনুগ্রহ করে পরিশোধ করুন:\n${v.parentLink}\n\n- ${v.schoolName}`;
}
