import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface SecurityAlertProps {
  alertType?: string
  description?: string
  timestamp?: string
  actionUrl?: string
  actionLabel?: string
}

const SecurityAlertEmail = ({
  alertType, description, timestamp, actionUrl, actionLabel,
}: SecurityAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Security alert: {alertType || 'Account activity detected'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={alertBanner}>
          <Text style={alertIcon}>🔒 Security Alert</Text>
        </Section>
        <Heading style={h1}>{alertType || 'Account Activity Detected'}</Heading>
        <Text style={text}>
          {description || 'We detected an important security event on your account.'}
        </Text>
        <Section style={detailsBox}>
          <Text style={detailLabel}>When</Text>
          <Text style={detailValue}>{timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</Text>
        </Section>
        <Text style={text}>
          If this was you, no action is needed. If you did not perform this action, please secure your account immediately.
        </Text>
        {actionUrl && (
          <Button style={button} href={actionUrl}>
            {actionLabel || 'Review Account'}
          </Button>
        )}
        <Hr style={hr} />
        <Text style={warningText}>
          ⚠️ Never share your password or login credentials. {SITE_NAME} will never ask for your password via email.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Security Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SecurityAlertEmail,
  subject: (data: Record<string, any>) =>
    `Security Alert: ${data.alertType || 'Account activity detected'}`,
  displayName: 'Security alert',
  previewData: {
    alertType: 'Password Changed',
    description: 'Your account password was successfully changed.',
    timestamp: '8 Apr 2026, 3:45 PM IST',
    actionUrl: 'https://edzenai.com/admin',
    actionLabel: 'Go to Dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const alertBanner = { backgroundColor: '#FEF2F2', padding: '16px 24px', borderRadius: '14px 14px 0 0', borderBottom: '3px solid #EF4444' }
const alertIcon = { color: '#DC2626', fontSize: '18px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '16px 20px', borderRadius: '10px', margin: '0 0 20px' }
const detailLabel = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0 0 4px', fontWeight: '500' as const, textTransform: 'uppercase' as const }
const detailValue = { fontSize: '14px', color: 'hsl(224, 30%, 14%)', margin: '0' }
const button = { backgroundColor: 'hsl(245, 58%, 51%)', color: '#ffffff', padding: '12px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const warningText = { fontSize: '13px', color: '#DC2626', lineHeight: '1.5', margin: '0 0 16px', backgroundColor: '#FEF2F2', padding: '12px 16px', borderRadius: '8px' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0' }
