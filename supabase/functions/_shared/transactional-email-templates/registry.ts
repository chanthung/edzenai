/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  replyTo?: string | ((data: Record<string, any>) => string | undefined)
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcomeSchool } from './welcome-school.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as subscriptionConfirmation } from './subscription-confirmation.tsx'
import { template as securityAlert } from './security-alert.tsx'
import { template as contactNotification } from './contact-notification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-school': welcomeSchool,
  'payment-receipt': paymentReceipt,
  'subscription-confirmation': subscriptionConfirmation,
  'security-alert': securityAlert,
  'contact-notification': contactNotification,
}
