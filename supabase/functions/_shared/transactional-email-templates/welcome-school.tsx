import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface WelcomeSchoolProps {
  schoolName?: string
  adminName?: string
}

const WelcomeSchoolEmail = ({ schoolName, adminName }: WelcomeSchoolProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your school is ready!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoBanner}>
          <Text style={logoText}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>
          {adminName ? `Welcome, ${adminName}!` : 'Welcome to EdZen AI!'}
        </Heading>
        <Text style={text}>
          {schoolName
            ? `Your school "${schoolName}" has been successfully created on ${SITE_NAME}.`
            : `Your school has been successfully created on ${SITE_NAME}.`}
        </Text>
        <Text style={text}>
          You now have a 30-day free trial with full access to all features. Here's what you can do next:
        </Text>
        <Section style={stepsSection}>
          <Text style={stepText}>✅ Add students manually or via Excel upload</Text>
          <Text style={stepText}>✅ Set up your academic year and fee structure</Text>
          <Text style={stepText}>✅ Add teachers and assign subjects</Text>
          <Text style={stepText}>✅ Configure your school profile and settings</Text>
        </Section>
        <Button style={button} href="https://edzenai.com/admin/getting-started">
          Get Started Now
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Need help? Reply to this email or use the Help assistant inside your dashboard.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeSchoolEmail,
  subject: 'Welcome to EdZen AI — Your school is ready!',
  displayName: 'Welcome school',
  previewData: { schoolName: 'Springfield Academy', adminName: 'Rajesh Kumar' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const logoBanner = { backgroundColor: 'hsl(245, 58%, 51%)', padding: '16px 24px', borderRadius: '14px 14px 0 0', marginBottom: '0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const stepsSection = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '16px 20px', borderRadius: '10px', margin: '0 0 24px' }
const stepText = { fontSize: '14px', color: 'hsl(224, 30%, 25%)', lineHeight: '1.8', margin: '0' }
const button = { backgroundColor: 'hsl(245, 58%, 51%)', color: '#ffffff', padding: '12px 28px', borderRadius: '14px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0 0 8px' }
