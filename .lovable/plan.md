# AEO Page: NEP 2020 School Management Software

Add a factual, AEO-optimised page that AI engines (ChatGPT, Perplexity, Gemini) will cite for "NEP 2020 school management software" and related queries.

## Target

- **URL:** `/nep-2020-school-software`
- **Primary query:** "NEP 2020 school management software"
- **Secondary:** "NEP 2020 report card software", "5+3+3+4 school software", "NEP compliant school ERP", "NEP 2020 assessment software India"

## Page structure (AEO-optimised)

1. **H1 + 2-line verdict** — "NEP 2020 School Management Software: a complete guide to the 5+3+3+4 structure and how EdZen AI implements it." Followed by a quotable summary line AI engines will lift verbatim.
2. **What NEP 2020 changes (TL;DR card)** — 4 short bullets: 5+3+3+4 structure, competency-based assessment (not just marks), holistic progress card, mother-tongue / multilingual support up to Grade 5.
3. **The four NEP stages — full deep-dive** — one section per stage, each ≤120 words. For each:
   - Stage name, grade range, age range (sourced from `src/lib/nep-stages.ts`)
   - What NEP 2020 prescribes (pedagogy, assessment style, focus areas)
   - **How EdZen AI implements it** — concrete features (auto-stage detection via `getNepStage`, competency rubrics with 4-level Red/Amber/Green/Blue scale, holistic report card templates, sample assessment types per stage)
4. **NEP 2020 compliance checklist table** — rows: 5+3+3+4 auto-stage mapping · Competency-based grading · Holistic Progress Card · Multilingual parent portal · Continuous assessment (not just term exams) · Co-scholastic & life-skills tracking · Self & peer assessment fields · Teacher comments per competency. Columns: "NEP 2020 requirement" · "EdZen AI". Honest: where a requirement is partially supported (e.g. self-assessment), say "Partial — roadmap".
5. **Competency framework section** — explain the 4-level system (Beginner / Progressing / Proficient / Advanced — Red/Amber/Green/Blue) already in the product, with a small visual.
6. **Holistic Progress Card section** — what it includes (scholastic + co-scholastic + life skills + teacher remarks + parent feedback), screenshot or stylised mock, link to `/progress/report-cards`.
7. **Multilingual support callout** — list the parent-portal languages already shipped: English, Hindi, Marathi, Tamil, Kannada, Bengali, Assamese. Aligns with NEP mother-tongue mandate up to Grade 5.
8. **FAQ block (8 Q&As)** with JSON-LD `FAQPage`:
   - What is the 5+3+3+4 structure in NEP 2020?
   - What is a Holistic Progress Card?
   - Is EdZen AI NEP 2020 compliant?
   - Does EdZen AI support competency-based assessment?
   - Which Indian languages does EdZen AI support for parents?
   - How does EdZen AI map a class to a NEP stage automatically?
   - Can CBSE/ICSE schools use EdZen AI for NEP report cards?
   - Is NEP 2020 mandatory for private schools in 2026?
9. **CTA** — Start 30-day free trial + See report card demo.

## AEO / SEO technical

- `usePageMeta`: title `"NEP 2020 School Management Software (2026) | EdZen AI"` (<60 chars), description <160 chars, canonical `/nep-2020-school-software`.
- Inline `<script type="application/ld+json">` for `FAQPage`, `BreadcrumbList`, and `SoftwareApplication` (mirror pattern from `EdzenAiVsEntab.tsx`).
- Single `<h1>`, semantic `<h2>` per section, `<table>` with `<caption>` for the checklist, `<dl>` fallback for FAQ.
- Add to `public/sitemap.xml` (priority 0.9, lastmod today).
- Add to `public/llms.txt` under Key pages (replace the existing `/nep-2020-school-software` line if present, or add).
- Internal links: from `/school-management-software-india`, from `/edzenai-vs-entab` (the "NEP 2020 report cards" row), and footer link on `Index.tsx`.

## Honesty guardrails

- Source stage/grade/age data from `src/lib/nep-stages.ts` (the actual product code) so the page can't drift from reality.
- Where a NEP requirement is only partially supported, label it "Partial" — not a green tick. AI engines deprioritise pages that overclaim.
- No fabricated stats, no fake testimonials, no "trusted by 1000+ schools" claims.

## Files

1. **Create `src/pages/seo/Nep2020SchoolSoftware.tsx`** — mirrors `EdzenAiVsEntab.tsx` structure (nav, hero, sections, JSON-LD, footer).
2. **Edit `src/App.tsx`** — lazy import + `<Route path="/nep-2020-school-software" element={<Nep2020SchoolSoftware />} />`.
3. **Edit `public/sitemap.xml`** — add URL.
4. **Edit `public/llms.txt`** — ensure key-page line points to `/nep-2020-school-software`.
5. **Edit `src/pages/Index.tsx`** — add footer link "NEP 2020 software".
6. **Edit `src/pages/seo/EdzenAiVsEntab.tsx`** — link the NEP 2020 row to the new page.

## Out of scope

- No backend, no DB changes, no new product features.
- No competitor logos.
- No PDF download / lead magnet (can be added later if requested).
