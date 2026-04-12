import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface ContactNotificationProps {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, phone, subject, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoBanner}>
          <Text style={logoText}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>New Contact Form Submission</Heading>
        <Text style={text}>You received a new message from the {SITE_NAME} website.</Text>

        <Section style={detailsSection}>
          <Text style={labelText}>Name</Text>
          <Text style={valueText}>{name || '—'}</Text>

          <Text style={labelText}>Email</Text>
          <Text style={valueText}>{email || '—'}</Text>

          {phone ? (
            <>
              <Text style={labelText}>Phone</Text>
              <Text style={valueText}>{phone}</Text>
            </>
          ) : null}

          <Text style={labelText}>Subject</Text>
          <Text style={valueText}>{subject || '—'}</Text>

          <Text style={labelText}>Message</Text>
          <Text style={valueText}>{message || '—'}</Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Reply directly to the sender at {email || 'the email above'}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `Contact: ${data.subject || 'New message from website'}`,
  displayName: 'Contact form notification',
  to: 'support@edzenai.com',
  previewData: {
    name: 'Rajesh Kumar',
    email: 'rajesh@school.edu',
    phone: '+91 98765 43210',
    subject: 'Pricing inquiry',
    message: 'I would like to know the pricing for 500 students.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const logoBanner = { backgroundColor: 'hsl(245, 58%, 51%)', padding: '16px 24px', borderRadius: '14px 14px 0 0', marginBottom: '0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const detailsSection = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '16px 20px', borderRadius: '10px', margin: '0 0 24px' }
const labelText = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '12px 0 2px', fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const valueText = { fontSize: '14px', color: 'hsl(224, 30%, 14%)', lineHeight: '1.6', margin: '0 0 4px' }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0 0 8px' }
