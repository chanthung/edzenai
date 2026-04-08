import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "EdZen AI"

interface PaymentReceiptProps {
  studentName?: string
  amount?: string
  paymentDate?: string
  schoolName?: string
  referenceNumber?: string
  categoryName?: string
  installmentName?: string
}

const PaymentReceiptEmail = ({
  studentName, amount, paymentDate, schoolName, referenceNumber, categoryName, installmentName,
}: PaymentReceiptProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment of ₹{amount || '0'} received for {studentName || 'student'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoBanner}>
          <Text style={logoText}>🎓 {SITE_NAME}</Text>
        </Section>
        <Heading style={h1}>Payment Receipt</Heading>
        <Text style={text}>
          A payment has been successfully recorded{schoolName ? ` at ${schoolName}` : ''}.
        </Text>
        <Section style={receiptBox}>
          <Row>
            <Column><Text style={labelText}>Student</Text></Column>
            <Column><Text style={valueText}>{studentName || '—'}</Text></Column>
          </Row>
          {categoryName && (
            <Row>
              <Column><Text style={labelText}>Fee Category</Text></Column>
              <Column><Text style={valueText}>{categoryName}</Text></Column>
            </Row>
          )}
          {installmentName && (
            <Row>
              <Column><Text style={labelText}>Installment</Text></Column>
              <Column><Text style={valueText}>{installmentName}</Text></Column>
            </Row>
          )}
          <Row>
            <Column><Text style={labelText}>Amount</Text></Column>
            <Column><Text style={amountText}>₹{amount || '0'}</Text></Column>
          </Row>
          <Row>
            <Column><Text style={labelText}>Date</Text></Column>
            <Column><Text style={valueText}>{paymentDate || '—'}</Text></Column>
          </Row>
          {referenceNumber && (
            <Row>
              <Column><Text style={labelText}>Reference</Text></Column>
              <Column><Text style={valueText}>{referenceNumber}</Text></Column>
            </Row>
          )}
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This is an automated receipt from {SITE_NAME}. For any questions, contact your school administration.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: (data: Record<string, any>) =>
    `Payment Receipt — ₹${data.amount || '0'} for ${data.studentName || 'Student'}`,
  displayName: 'Payment receipt',
  previewData: {
    studentName: 'Ananya Sharma',
    amount: '15,000',
    paymentDate: '15 Jan 2026',
    schoolName: 'Springfield Academy',
    referenceNumber: 'TXN-2026-001',
    categoryName: 'Tuition Fee',
    installmentName: 'Term 1',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' }
const logoBanner = { backgroundColor: 'hsl(245, 58%, 51%)', padding: '16px 24px', borderRadius: '14px 14px 0 0' }
const logoText = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, margin: '0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(224, 30%, 14%)', margin: '24px 0 16px' }
const text = { fontSize: '14px', color: 'hsl(224, 12%, 50%)', lineHeight: '1.6', margin: '0 0 16px' }
const receiptBox = { backgroundColor: 'hsl(228, 25%, 97%)', padding: '20px', borderRadius: '10px', margin: '0 0 24px' }
const labelText = { fontSize: '13px', color: 'hsl(224, 12%, 50%)', margin: '4px 0', fontWeight: '500' as const }
const valueText = { fontSize: '14px', color: 'hsl(224, 30%, 14%)', margin: '4px 0', textAlign: 'right' as const }
const amountText = { fontSize: '18px', color: 'hsl(245, 58%, 51%)', margin: '4px 0', fontWeight: 'bold' as const, textAlign: 'right' as const }
const hr = { borderColor: 'hsl(228, 18%, 89%)', margin: '28px 0' }
const footer = { fontSize: '12px', color: 'hsl(224, 12%, 50%)', margin: '0' }
