import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Row, Column, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface SubscriptionConfirmationProps {
  schoolName?: string
  planName?: string
  subscriptionType?: string
  startDate?: string
  renewalDate?: string
  amount?: string
}

const SubscriptionConfirmationEmail = ({
  schoolName, planName, subscriptionType, startDate, renewalDate, amount,
}: SubscriptionConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Subscription activated for {schoolName || 'your school'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoBanner}>
          <Text style={logoText}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>Subscription Confirmed! 🎉</Heading>
        <Text style={text}>
          {schoolName
            ? `Great news! ${schoolName}'s subscription has been successfully activated.`
            : 'Your subscription has been successfully activated.'}
        </Text>
        <Section style={detailsBox}>
          <Row>
            <Column><Text style={labelText}>Plan</Text></Column>
            <Column><Text style={valueText}>{planName || 'Starter'}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={labelText}>Billing</Text></Column>
            <Column><Text style={valueText}>{subscriptionType || 'Monthly'}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={labelText}>Start Date</Text></Column>
            <Column><Text style={valueText}>{startDate || '—'}</Text></Column>
          </Row>
          {renewalDate && (
            <Row>
              <Column><Text style={labelText}>Next Renewal</Text></Column>
              <Column><Text style={valueText}>{renewalDate}</Text></Column>
            </Row>
          )}
        </Section>
        <Text style={text}>
          Your school now has full access to all {planName || 'plan'} features. You can manage your subscription from the dashboard.
        </Text>
        <Button style={button} href="https://edzenai.com/admin">
          Go to Dashboard
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Questions about billing? Reply to this email and we'll help.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Subscription Activated — ${data.schoolName || 'Your School'}`,
  displayName: 'Subscription confirmation',
  previewData: {
    schoolName: 'Springfield Academy',
    planName: 'Pro',
    subscriptionType: 'Annual',
    startDate: '1 Jan 2026',
    renewalDate: '1 Jan 2027',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const logoBanner = { backgroundColor: 'hsl(245, 58%, 51%)', padding: '16px 24px', borderRadius: '14px 14px 0 0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '20px', borderRadius: '10px', margin: '0 0 24px' }
const labelText = { fontSize: '13px', color: 'hsl(224, 12%, 50%)', margin: '4px 0', fontWeight: '500' as const }
const valueText = { fontSize: '14px', color: 'hsl(224, 30%, 14%)', margin: '4px 0', textAlign: 'right' as const }
const button = { backgroundColor: 'hsl(245, 58%, 51%)', color: '#ffffff', padding: '12px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0 0 8px' }
