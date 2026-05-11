## Goal

Create a new SEO landing page at `/school-management-software-india` targeting the query "best school management software India". The page must answer: what EdZen AI is, who it's for, pricing, comparison vs competitors, and the free trial.

## Changes

### 1. New page: `src/pages/seo/SchoolManagementSoftwareIndia.tsx`

Sections (top → bottom):

1. **Hero** — H1 "Best School Management Software in India (2026)". Sub: positioning EdZen AI for CBSE/ICSE/State-board private schools. Two CTAs: "Start 30-day free trial" → `/signup`, "Book demo" → `/book-demo`. Trust badges: No credit card, Setup in 1 day, WhatsApp parent portal.
2. **What is EdZen AI** — 3-line summary + 6 feature cards (UPI fee collection, WhatsApp reminders, NEP 2020 report cards, AI at-risk monitoring, Daily attendance, Marks & competencies). Reuse icon style from existing landing page.
3. **Who it's for** — 3 audience cards: School principals (Tier 2/3 cities), Accountants (fee collection), Teachers (marks & attendance).
4. **Pricing snapshot** — Starter (₹7/student/mo), Pro (₹10/student/mo). CTA → `/pricing`.
5. **Comparison table** — EdZen AI vs Entab vs Fedena vs Edunext. Rows: Setup time, WhatsApp parent portal (no app), UPI auto-reconciliation, NEP 2020 templates, AI insights, Pricing model, Free trial. Use `Card` + responsive table.
6. **Free trial section** — 30 days, no credit card, full Pro features. Single CTA.
7. **FAQ accordion** — 6 Q&As: best SMS for India, CBSE/ICSE support, parent app needed, data security, switching from Entab/Fedena, pricing for small schools. Use `Accordion` from `@/components/ui/accordion`.
8. **Final CTA banner**.

Use shared landing components/styles already in `src/pages/Index.tsx` (navbar, footer) — import the same Header/Footer rather than duplicating. If they're inline in `Index.tsx`, extract a minimal copy into the new page (no refactor of Index).

### 2. SEO

- `usePageMeta({ title: "Best School Management Software in India 2026 | EdZen AI", description: "EdZen AI — UPI fee collection, WhatsApp parent portal, NEP 2020 report cards & AI insights for CBSE/ICSE/State-board schools. 30-day free trial.", canonical: "/school-management-software-india" })`
- Inline JSON-LD `<script type="application/ld+json">` injected via `useEffect`, two schemas:
  - `FAQPage` with the 6 FAQ Q&As.
  - `Product` / `SoftwareApplication` summary with `aggregateRating`-free offers (reuse fields from `index.html`).
- Single `<h1>`, semantic `<section>` blocks, alt text on any imagery, `loading="lazy"` for images.

### 3. Routing

`src/App.tsx`:

- Add `const SchoolManagementSoftwareIndia = lazy(() => import("./pages/seo/SchoolManagementSoftwareIndia"));`
- Add `<Route path="/school-management-software-india" element={<SchoolManagementSoftwareIndia />} />` in the public routes block.

### 4. Sitemap

`public/sitemap.xml`: add

```
<url>
  <loc>https://edzenai.com/school-management-software-india</loc>
  <lastmod>2026-05-11</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.9</priority>
</url>
```

### 5. llms.txt

`public/llms.txt`: add to Key pages list:
`- [Best SMS India](https://edzenai.com/school-management-software-india): What EdZen AI is, pricing, vs Entab/Fedena/Edunext, free trial`

## Notes

- Comparison claims kept factual & defensible (setup time, WhatsApp portal, pricing model). Avoid disparaging language.
- Pricing matches project memory (Starter ₹7, Pro ₹10, Pro with 30-day free trial).
- No backend changes. No new dependencies. Reuses `Card`, `Button`, `Accordion`, `usePageMeta`.
- This is the first of a series — folder `src/pages/seo/` created so future query-cluster pages (`/cbse-icse-report-card-software`, `/nep-2020-school-software`, `/edzenai-vs-entab`, etc.) drop in alongside.