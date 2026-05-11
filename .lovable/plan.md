## Goal

Create SEO landing page at `/fee-collection-software-schools-india` targeting "school fee collection WhatsApp UPI India". Page explains how EdZen AI's fee collection works end-to-end: UPI payments, WhatsApp reminders, parent payment proof upload, and admin verification.

## Changes

### 1. New page: `src/pages/seo/FeeCollectionSoftwareIndia.tsx`

Mirrors the structure of `SchoolManagementSoftwareIndia.tsx` (same Header/Footer, sections, Card/Button/Accordion, `usePageMeta`, lazy images, semantic sections, single H1).

Sections:

1. **Hero** — H1 "School Fee Collection Software with UPI & WhatsApp (India)". Sub: zero-app parent fee collection for CBSE/ICSE/State-board schools. CTAs: "Start 30-day free trial" → `/signup`, "Book demo" → `/book-demo`. Trust badges: UPI any app, WhatsApp reminders, No parent app install.
2. **How fee collection works** — 4-step horizontal flow:
   1. School sets fee structure (annual / monthly installments, per-class, optional categories)
   2. Parent receives WhatsApp link (no login, token-based view)
   3. Parent pays via UPI deep-link (any UPI app — GPay, PhonePe, Paytm, BHIM)
   4. Parent uploads payment proof; admin verifies → status auto-updates (Pending → Paid)
3. **UPI deep-link payments** — explainer card. `upi://pay` deep-link opens parent's UPI app pre-filled with school VPA, amount, installment ref. Works on every Indian UPI app. No payment gateway fees, no per-transaction cut.
4. **WhatsApp fee reminders** — explainer card. Automated pg_cron 8 AM IST reminders: 5 days before due, on due date, 1 day after. Bulk parent link share with throttle. Sent via Mayavi WhatsApp (no parent app).
5. **Payment proof verification workflow** — explainer card. Parent uploads screenshot/photo via parent portal. OCR-assisted preview. Admin approves/rejects from dashboard. Status derived dynamically (Pending / Paid / Overdue) — never stale.
6. **Flexible fee structure** — Card grid: annual or monthly installments, per-class fees, optional categories (transport, lab, exam), retroactive auto-assignment, sibling/family grouping by parent phone.
7. **Reporting & reconciliation** — Card grid: collection rate by class/category, overdue list, payment history per student, exportable reports, anomaly detection.
8. **Comparison row** — Compact table: EdZen AI vs traditional gateway-based SMS. Rows: parent app required, UPI deep-link, WhatsApp reminders included, transaction fees, proof verification, setup time.
9. **FAQ accordion** — 6 Q&As:
   - Do parents need to install an app?
   - Which UPI apps are supported?
   - Do you charge transaction fees?
   - How are reminders sent?
   - Can parents pay in installments?
   - Is payment proof verification automatic?
10. **Final CTA banner** — "Start collecting fees on UPI + WhatsApp in 1 day".

### 2. SEO

- `usePageMeta({ title: "School Fee Collection Software with UPI & WhatsApp | EdZen AI", description: "Collect school fees via UPI deep-link and WhatsApp — no parent app, no transaction fees. Auto reminders, payment proof verification, flexible installments. 30-day free trial.", canonical: "/fee-collection-software-schools-india" })`
- Two JSON-LD schemas via `useEffect`:
  - `FAQPage` with the 6 Q&As.
  - `SoftwareApplication` (sub-application: fee collection module) with offer pricing (Starter ₹7, Pro ₹10).

### 3. Routing

`src/App.tsx`:
- Add lazy import next to `SchoolManagementSoftwareIndia`.
- Add `<Route path="/fee-collection-software-schools-india" element={<FeeCollectionSoftwareIndia />} />` in the public routes block.

### 4. Sitemap

`public/sitemap.xml`: add entry, `priority: 0.9`, `changefreq: monthly`, `lastmod: 2026-05-11`.

### 5. llms.txt

`public/llms.txt`: add to Key pages list:
`- [Fee Collection India](https://edzenai.com/fee-collection-software-schools-india): UPI deep-link, WhatsApp reminders, payment proof verification, flexible installments`

## Notes

- Reuses existing `Card`, `Button`, `Accordion`, `usePageMeta`. No new deps, no backend changes.
- Claims align with project memory: UPI deep-link with `&am` injection, Mayavi WhatsApp (+91 prepended), pg_cron 8 AM IST reminders (5d/0d/+1d), parent token access via `/view/:name/:token`, derived fee status, flexible annual/monthly fees, sibling grouping by parent phone.
- Pricing matches: Starter ₹7, Pro ₹10 (30-day free trial). No "Max" plan.
- Folder `src/pages/seo/` already exists; this is page 2 in the series.
