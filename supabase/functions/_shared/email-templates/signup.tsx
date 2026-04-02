/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Verify your email for EdZen AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Text style={logoText}>🎓 EdZen AI</Text>
        </div>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Welcome to{' '}
          <Link href={siteUrl} style={link}>
            <strong>EdZen AI</strong>
          </Link>
          ! We're excited to have you on board.
        </Text>
        <Text style={text}>
          Please verify your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify Email
        </Button>
        <Text style={footer}>
          If you didn't create an account on EdZen AI, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '480px', margin: '0 auto' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logoText = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(174, 60%, 40%)', margin: '0' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(215, 25%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(215, 15%, 50%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: 'hsl(174, 60%, 40%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(174, 60%, 40%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
