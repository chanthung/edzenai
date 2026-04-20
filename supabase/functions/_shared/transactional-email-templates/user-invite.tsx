import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface UserInviteProps {
  name?: string
  schoolName?: string
  roleLabel?: string
  inviteUrl?: string
  expiresInDays?: number
  invitedByName?: string
}

const UserInviteEmail = ({ name, schoolName, roleLabel, inviteUrl, expiresInDays, invitedByName }: UserInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {schoolName || SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoBanner}>
          <Text style={logoText}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>
          {name ? `Hi ${name}, you're invited!` : `You're invited!`}
        </Heading>
        <Text style={text}>
          {invitedByName ? `${invitedByName} has invited you` : 'You have been invited'}
          {' '}to join <strong>{schoolName || 'their school'}</strong> on {SITE_NAME}
          {roleLabel ? <> as a <strong>{roleLabel}</strong></> : null}.
        </Text>
        <Text style={text}>
          Click the button below to set up your password and activate your account.
        </Text>
        <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
          <Button style={button} href={inviteUrl}>
            Accept Invite & Set Password
          </Button>
        </Section>
        <Section style={infoBox}>
          <Text style={infoText}>
            ⏰ This invite link expires in <strong>{expiresInDays ?? 7} days</strong>.
          </Text>
          <Text style={infoText}>
            🔒 The link is single-use and personal to you — please don't share it.
          </Text>
        </Section>
        <Text style={smallText}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>{inviteUrl}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you weren't expecting this invite, you can safely ignore this email.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UserInviteEmail,
  subject: (data: Record<string, any>) =>
    data?.schoolName ? `You've been invited to join ${data.schoolName} on ${SITE_NAME}` : `You've been invited to ${SITE_NAME}`,
  displayName: 'User invite',
  previewData: {
    name: 'Priya Sharma',
    schoolName: 'Springfield Academy',
    roleLabel: 'Teacher',
    inviteUrl: 'https://edzenai.com/auth/accept-invite?token=preview-token',
    expiresInDays: 7,
    invitedByName: 'Rajesh Kumar',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const logoBanner = { backgroundColor: 'hsl(245, 58%, 51%)', padding: '16px 24px', borderRadius: '14px 14px 0 0', marginBottom: '0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: 'hsl(245, 58%, 51%)', color: '#ffffff', padding: '14px 32px', borderRadius: '14px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const infoBox = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '14px 18px', borderRadius: '10px', margin: '0 0 24px' }
const infoText = { fontSize: '13px', color: 'hsl(224, 30%, 25%)', lineHeight: '1.6', margin: '4px 0' }
const smallText = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '16px 0 4px' }
const linkText = { fontSize: '12px', color: 'hsl(245, 58%, 51%)', wordBreak: 'break-all' as const, margin: '0 0 16px' }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0 0 8px' }
