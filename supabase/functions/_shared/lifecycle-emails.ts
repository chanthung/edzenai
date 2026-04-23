// Lifecycle email/WhatsApp message templates

export type LifecycleStage = 'grace_period' | 'warning_phase' | 'suspended' | 'terminated';

export interface LifecycleMessageContext {
  schoolName: string;
  daysIntoExpiry: number;
  daysRemainingInStage: number;
  renewUrl: string;
}

export function getEmailSubject(stage: LifecycleStage, ctx: LifecycleMessageContext): string {
  switch (stage) {
    case 'grace_period':
      return `⏰ Renew your EdZen AI subscription — ${ctx.daysRemainingInStage} days of full access remaining`;
    case 'warning_phase':
      return `⚠️ Action required: Limited access mode — renew within ${ctx.daysRemainingInStage} days`;
    case 'suspended':
      return `🔴 EdZen AI service paused — renew to restore access`;
    case 'terminated':
      return `Final notice: Your EdZen AI account is scheduled for deletion`;
  }
}

export function getEmailBody(stage: LifecycleStage, ctx: LifecycleMessageContext): string {
  const greeting = `Hi ${ctx.schoolName} team,`;
  const footer = `\n\nRenew now: ${ctx.renewUrl}\n\nNeed help? Reply to this email or contact support@edzenai.com.\n\n— The EdZen AI Team`;

  switch (stage) {
    case 'grace_period':
      return `${greeting}\n\nGentle reminder — your EdZen AI subscription expired ${ctx.daysIntoExpiry} day(s) ago. You still have full access for the next ${ctx.daysRemainingInStage} days.\n\nRenew now to avoid any interruption to your school's operations.${footer}`;
    case 'warning_phase':
      return `${greeting}\n\nYour EdZen AI subscription has been expired for ${ctx.daysIntoExpiry} days. Your account is now in **limited access mode**:\n\n• Admins can still log in to renew\n• Teachers and accountants are temporarily locked out\n• Data entry is restricted\n\nIn ${ctx.daysRemainingInStage} days, your account will be **fully suspended** until renewal. Please renew now to restore normal access.${footer}`;
    case 'suspended':
      return `${greeting}\n\nYour EdZen AI subscription has been expired for ${ctx.daysIntoExpiry} days. Your account is now **suspended** — no users can access the system.\n\n**Your data is safe** and will be preserved. Renew at any time to restore full access immediately.\n\nIf no action is taken within ${ctx.daysRemainingInStage} days, your account will be scheduled for deletion.${footer}`;
    case 'terminated':
      return `${greeting}\n\nYour EdZen AI account has been marked for deletion. All school data (students, fees, marks, attendance) will be permanently deleted in 30 days.\n\nIf you wish to restore your account and data, contact support@edzenai.com immediately. After the 30-day window, recovery will not be possible.${footer}`;
  }
}

export function getWhatsAppMessage(stage: LifecycleStage, ctx: LifecycleMessageContext): string {
  switch (stage) {
    case 'grace_period':
      return `⏰ EdZen AI: Your subscription expired ${ctx.daysIntoExpiry} day(s) ago. ${ctx.daysRemainingInStage} days of full access remaining.\n\nRenew now: ${ctx.renewUrl}`;
    case 'warning_phase':
      return `⚠️ EdZen AI: Limited access mode active. Renew within ${ctx.daysRemainingInStage} days to avoid suspension.\n\nRenew: ${ctx.renewUrl}`;
    case 'suspended':
      return `🔴 EdZen AI: Service paused — your data is safe. Renew to restore access.\n\n${ctx.renewUrl}`;
    case 'terminated':
      return `Final notice from EdZen AI: Your account is scheduled for deletion. Contact support@edzenai.com to restore.`;
  }
}

// Notification trigger days per stage (days into expiry)
export const NOTIFICATION_DAYS: Record<LifecycleStage, number[]> = {
  grace_period: [1, 7, 14],
  warning_phase: [16, 21, 28],
  suspended: [31, 45, 60, 89],
  terminated: [90],
};
