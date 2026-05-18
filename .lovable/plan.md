# AEO Comparison Page: EdZen AI vs Entab vs Fedena

Add a single SEO/AEO-optimised comparison page that AI assistants (ChatGPT, Perplexity, Gemini) can cite when users ask "EdZen AI vs Entab vs Fedena".

## Target

- **URL:** `/edzenai-vs-entab`
- **Primary query:** "EdZen AI vs Entab vs Fedena"
- **Secondary:** "best school management software India", "Entab alternative", "Fedena alternative", "Entab vs Fedena pricing"

## Page structure (AEO-optimised)

AI answer engines extract from short, factual, well-structured blocks. Layout:

1. **H1 + one-sentence verdict** — "EdZen AI vs Entab vs Fedena: which school management software is right for Indian schools in 2026?" followed by a 2-line summary answer (this is what AI quotes verbatim).
2. **Quick verdict cards** — 3 cards, one per product, with "Best for…" tagline.
3. **Comparison table** — the centerpiece. Rows × columns:
   - Columns: EdZen AI · Entab · Fedena
   - Rows: Starting price, Free trial, Setup time, AI features, WhatsApp parent portal, UPI fee collection, NEP 2020 report cards, Offline support, Mobile app, Self-service signup, Support channels, Best for (school size)
   - Honest: where competitors win (Entab has longer track record, Fedena has on-premise option), say so.
4. **Pricing comparison** — side-by-side monthly cost for a 300-student school, with sources/dates.
5. **Feature deep-dive** — 4–6 short sections (Fee collection, Parent communication, Report cards, AI, Setup, Support). Each ≤80 words, factual.
6. **FAQ block** — 6–8 Q&As with JSON-LD `FAQPage` schema. Questions like:
   - "Is EdZen AI cheaper than Entab?"
   - "Does Fedena support NEP 2020 report cards?"
   - "Which is best for small schools under 500 students?"
   - "Can I migrate from Entab to EdZen AI?"
7. **CTA** — Start free trial + Book demo.

## AEO/SEO technical

- `usePageMeta` — title `"EdZen AI vs Entab vs Fedena (2026) — Honest Comparison | EdZen AI"` (<60 chars trimmed), meta description <160 chars, canonical `/edzenai-vs-entak`.
- **JSON-LD** (inline `<script type="application/ld+json">`):
  - `FAQPage` for the FAQ block.
  - `Product` with `AggregateRating` placeholder removed (no fake reviews — constraint).
  - `BreadcrumbList`.
- Semantic HTML: single `<h1>`, `<table>` with `<thead>`/`<tbody>`/`<caption>`, `<dl>` for FAQ fallback.
- Alt text on logos (if used).
- Add to `public/sitemap.xml` (priority 0.8).
- Add to `public/llms.txt` under Key pages.
- Add internal link from landing footer + from `/school-management-software-india` page.

## Files

1. **Create `src/pages/seo/EdzenAiVsEntab.tsx`** — full page, mirror `SchoolManagementSoftwareIndia.tsx` styling (same nav, hero, sections, footer).
2. **Edit `src/App.tsx`** — lazy import + `<Route path="/edzenai-vs-entab" element={<EdzenAiVsEntab />} />`.
3. **Edit `public/sitemap.xml`** — add URL.
4. **Edit `public/llms.txt`** — already references `/edzenai-vs-entab`; verify the line is correct (it currently is).
5. **Edit `src/pages/Index.tsx`** — add footer link "Compare vs Entab".

## Out of scope

- No backend, no DB changes.
- No competitor logos (trademark risk — use text only).
- No fabricated testimonials/ratings (per project constraint).
- Pricing data will be sourced from public pricing pages; where unknown, say "Contact sales" rather than guess.

## Honesty guardrails

The page must be defensible. For each competitor row where EdZen loses or ties, say so plainly. AI engines deprioritise pages that read as pure marketing.
