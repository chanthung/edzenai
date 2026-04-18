
User approved: PDF, detailed Progress, with screenshots. Need to generate a branded PDF user manual covering 4 roles (Admin, Teacher, Accountant + Student Progress reference) with screenshots from the live app.

## Plan

**Deliverable:** Single branded PDF (`EdZenAI-User-Manual.pdf`) saved to `/mnt/documents/`, ~14-18 pages.

### Steps
1. **Capture screenshots** from the live preview using browser tools — login as platform admin, navigate to key screens (Admin Dashboard, Students, Fee Setup, Teachers, Marks Entry, Attendance, Report Cards, Parent View). Save to `/tmp/screenshots/`.
2. **Generate PDF** with ReportLab using EdZen AI indigo/purple branding (#6366f1, #8b5cf6), cover page, TOC, role sections, and embedded screenshots.
3. **QA pass** — convert PDF to images, inspect every page for layout issues, fix, re-render.
4. **Deliver** as `<lov-artifact>`.

### PDF Structure

**Cover** — EdZen AI logo, "User Manual v1.0", tagline, date

**TOC**

**Section 1 — Getting Started (1 page)**
- Login URL, password reset, role overview

**Section 2 — School Admin (3 pages)**
- First 5 things after login (create academic year, add students, set up fees, add teachers, configure school profile)
- Daily workflow (check dashboard → review pending fees → verify payment proofs → send reminders → respond to parent queries)
- Common mistakes (skipping academic year setup, wrong class normalization, forgetting QR upload)
- Tips (use bulk WhatsApp share, enable AI Help chatbot, monitor Birthday widget)
- Screenshots: Dashboard, Students table, Fee Setup

**Section 3 — Teacher (3 pages)**
- First 5 (verify subject assignments, set up assessments, enter marks for current assessment, mark today's attendance, generate sample report card)
- Daily workflow (mark attendance → enter marks after each test → review at-risk students → use AI Insights weekly)
- Common mistakes (wrong assessment selected, not saving marks, ignoring red-border validation)
- Tips (Mark All Present then adjust, use templates, check Student Monitoring badges)
- Screenshots: Marks Entry, Attendance, AI Insights panel

**Section 4 — Accountant (2 pages)**
- First 5 (review fee structures, check pending list, record first payment, verify payment proof, generate monthly report)
- Daily workflow (check pending proofs → verify & approve → record offline payments → send WhatsApp reminders → reconcile)
- Common mistakes (recording wrong installment, forgetting receipt, missing partial payments)
- Tips (use installment grouping, bulk reminders, monthly collection report)
- Screenshots: Payment Recorder, Pending Proofs, Fee Reports

**Section 5 — Student Progress Module (3-4 pages, detailed)**
- How marks flow: Subjects → Assessments → Templates → Marks Entry → Report Cards
- NEP 2020 stages (Foundational/Preparatory/Middle/Secondary)
- Competency tracking (Red/Amber/Green/Blue)
- AI Insights (4 sections: trends, gaps, interventions, predictions)
- At-Risk monitoring (Healthy/Watch/Needs Attention/Critical)
- Report card generation (individual + bulk class print)
- Screenshots: Subjects, Assessments, Report Card, Competency view

**Appendix — Parent View (1 page)**
- What parents see via WhatsApp link
- Tabs: Fees, Academic Progress
- UPI deep-link payment flow
- How staff can answer common parent questions

**Back cover** — Support contact, edzenai.com, "Need help? Use the AI Help chatbot in the app"

### Technical approach
- ReportLab Platypus (SimpleDocTemplate, Paragraph, Image, Table, PageBreak)
- Custom header/footer with page numbers
- Indigo gradient cover page
- Code blocks/tips in light-purple boxes
- Screenshots auto-fitted to page width (max 6.5 inches)
- A4 page size

### Screenshots capture plan
Login as `support@edzenai.com` → navigate to:
- `/admin/dashboard`
- `/admin/students`
- `/admin/fee-setup`
- `/admin/teachers`
- `/progress/dashboard`
- `/progress/marks-entry`
- `/progress/attendance`
- `/progress/report-cards`
- `/view/:name/:token` (parent view sample)

If a screen requires data the test account lacks, use a clean placeholder note in the manual instead.

### QA
After render: `pdftoppm -jpeg -r 120 manual.pdf qa` → view every page → fix overflow/clipping/contrast → re-render until clean. Report findings in final message.
