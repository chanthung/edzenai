# School Onboarding Guide (PDF)

A downloadable, print-ready PDF walkthrough for setting up a brand-new school on EdZen AI — from Google sign-up through AI Excel student import and full fee setup.

## What the guide will cover

1. **Before you start** — what to keep ready (school Gmail account, logo, student Excel sheet, fee circular, UPI ID / payment QR image).
2. **Create the school account with Google**
   - Visit the sign-in page, choose "Continue with Google", pick the school's Gmail account.
   - Onboarding wizard Step 1: school name, admin name, phone.
   - Step 2: choose plan (Starter vs Pro trial) and finish.
   - What happens automatically: school record, admin role, default fee categories (Tuition, Transport, Activities), 30-day Pro trial where applicable.
3. **First-run setup**
   - Academic year creation and setting the current year.
   - School profile in Settings: logo, address, phone, board, default classes/sections.
   - Payment details: UPI ID + QR image (needed so parents see the Pay button on parent links).
4. **AI bulk import of students from Excel**
   - Preparing the sheet (recommended columns, class naming, parent phone +91 10-digit rule, Aadhaar 12-digit rule).
   - Students → "Import via Excel (AI)": upload, AI column mapping, review, confirm.
   - Duplicate detection: strong (red) vs soft (yellow) matches and how to resolve.
   - Downloading the issues report for failed rows and re-uploading corrections.
   - Manual add for one-off students.
5. **Fee setup**
   - Fee categories (mandatory vs optional, category groups).
   - Fee structures per category with total amount and due date.
   - Installments — full payment vs custom schedule, auto-generation.
   - Assigning structures to classes; retroactive assignment to existing students.
   - Verifying a student's fee sheet and understanding derived status (Pending / Paid / Overdue).
6. **Share with parents & verify**
   - Generating and bulk-sharing parent links over WhatsApp.
   - What the parent sees: fees, QR/UPI pay, payment proof upload, attendance, progress.
   - Accountant flow: verifying proofs and recording payments.
7. **Troubleshooting & checklist** — common errors and a final go-live checklist.

## Technical notes

- Output: a multi-page A4 PDF generated with ReportLab, styled with the EdZen indigo/purple palette and the EdZen logo, written to `/mnt/documents/` and attached in chat.
- Content will be derived from the actual app flows (Onboard wizard, Students AI import, FeeSetup tabs, Settings, parent link sharing) so steps match real button labels.
- Every page will be rendered to images and visually QA'd for clipping, overflow, and spacing before delivery.
- No application code changes.
