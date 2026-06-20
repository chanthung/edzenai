# Alternate landing page at `/home-v2`

A separate route that mirrors eduerp.ai's structural ideas but uses EdZen's existing brand (indigo/purple, current fonts, existing logo). The current `/` landing stays untouched so we can A/B and switch later.

## Route & wiring

- Add `src/pages/HomeV2.tsx` (lazy-loaded) and register `/home-v2` in `src/App.tsx`.
- Reuse the existing site navbar + footer from `Index.tsx` by extracting them into shared components only if trivial; otherwise inline the same markup/classes so visuals match exactly. Navbar links: Features, About, Pricing, Sign In, Start Free Trial (same targets as current).
- `usePageMeta`: title "EdZen AI — School Management, Reimagined", description matching current landing tone, canonical `/home-v2`, `noindex` until promoted to `/`.
- Add `/home-v2` to `public/sitemap.xml` only if/when we decide to index it (skip for now).

## Sections (top → bottom)

1. **Hero — animated word swap**
   - Layout: centered, eduerp-style. Small eyebrow chip "AI-Powered School ERP".
   - H1 split into 3 lines: static word + a rotating word that cycles `Simplify → Connect → Succeed` every 2.4s using a `setInterval` + `key`-based `animate-fade-in` (Tailwind utility already in project). No new libs.
   - Subtext: "Unify admissions, fees, attendance, and progress in one AI-powered platform — built for Indian schools."
   - Primary CTA `Start Free Trial` → `/signup?plan=pro`. Secondary `Book a Demo` → `/contact`.
   - Right/under: two existing product screenshots if available in `src/assets`, otherwise stacked rounded-3xl gradient cards (indigo/purple tokens). No new image generation.

2. **Scrolling feature marquee**
   - Single horizontal infinite marquee of pill badges using a CSS keyframe (`@keyframes marquee` added to `tailwind.config.ts` + `index.css`). Two duplicated tracks for seamless loop, `hover:[animation-play-state:paused]`.
   - Items (lucide-react icons + text, semantic tokens only): NEP 2020 Compliant · WhatsApp-First Communication · UPI / Razorpay Payments · AI Progress Reports · Attendance Tracking · Multi-School RLS · Parent No-Login Access · Bulk Student Import · Email + SMS Reminders · Token-Based Sharing.

3. **Solutions / modules grid**
   - Heading "Everything your school runs on" + supporting line.
   - `grid md:grid-cols-2 lg:grid-cols-3 gap-6` of 6 cards (lucide icons in `bg-primary/10 rounded-xl p-3`): Student Management, Fee Collection, Attendance, Academic Progress (NEP), Parent Communication, AI Insights. Each card: icon, title, 1-sentence description, optional "Learn more" link to existing matching page if present (else nothing — no broken links).
   - Cards: `rounded-2xl border bg-card p-6 hover:shadow-lg transition`.

4. **Final CTA strip**
   - Indigo→purple gradient panel `rounded-3xl`, "Ready to simplify your school?" + Start Free Trial + Contact Us buttons. Mirrors existing landing CTA tone.

## Design rules

- Strictly semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-card`, `border`, `text-muted-foreground`). No raw hex, no `text-white`/`bg-black`.
- Existing fonts and logo (`@/assets/edzen-logo-full.png`).
- Mobile-first; hero text scales `text-4xl sm:text-6xl lg:text-7xl` with `font-bold tracking-tight`.
- Accessibility: word-swap announces via `aria-live="polite"`; marquee wrapped in `role="list"` with `aria-label`, respects `prefers-reduced-motion` (animation disabled).

## Technical details

Files:
- `src/pages/HomeV2.tsx` (new)
- `src/App.tsx` (add lazy import + route)
- `tailwind.config.ts` (add `marquee` keyframe + animation)
- `src/index.css` (add `@media (prefers-reduced-motion)` override + any helper)

No new dependencies. No backend changes. No edits to existing `/` route, sitemap, or memory-locked landing design.

## Out of scope

- Replacing `/` (explicitly deferred per user choice).
- Stats/trust bar section (not selected).
- Testimonials (constraint: no mock testimonials).
- New illustrations / image generation.