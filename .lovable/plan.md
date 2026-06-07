# Plan: About Page for EdZen AI

## 1. New file: `src/pages/About.tsx`
A single-page component matching the existing site's structure (same nav + footer used on `Index.tsx`, reusing tokens from `index.css` and shadcn `Button`/`Card`). Uses `usePageMeta` for SEO (title + description + canonical `/about`).

Sections, top to bottom, in the existing site container width (`max-w-6xl mx-auto px-4 sm:px-6`):

1. **Hero** — centered, generous vertical padding
   - H1: "Built for Schools. Powered by AI."
   - Sub: "EdZen AI was created to simplify school management for every principal, teacher, and parent across India."

2. **Our Story** — centered max-w-2xl paragraph block, heading "Our Story" + supplied 3 sentences.

3. **What We Do** — section heading + grid `grid md:grid-cols-3 gap-6`, three `Card`s.
   - Uses lucide-react icons (no emojis in UI) styled with primary token: `GraduationCap`, `Wallet`, `Sparkles`.
   - Each card: icon in a rounded primary-tinted square, title, description.

4. **Our Mission** — centered quote block: large serif-italic-ish styling using existing tokens, left border accent (`border-l-4 border-primary`), muted background `bg-secondary/50 rounded-2xl`, single line as supplied.

5. **Built With** — 2-column grid `grid sm:grid-cols-2 gap-4` of 4 items, each with lucide icon + label:
   - Made in India (`Flag`)
   - Designed for Indian Schools (`School`)
   - WhatsApp-first approach (`MessageCircle`)
   - Secure & private student data (`ShieldCheck`)

6. **CTA** — centered card with heading "Ready to simplify your school?" and two buttons: `Start Free Trial` → `/signup?plan=pro`, `Contact Us` (outline) → `/contact`.

Nav and footer: extract the same JSX used on `Index.tsx` (logo + Features/Pricing/About links + Login/Start Free Trial buttons; existing footer block). Implemented inline in `About.tsx` to avoid refactor scope creep — no new shared component.

## 2. Edit `src/pages/Index.tsx`
- Add `<Link to="/about">About</Link>` in the desktop nav between Features and Pricing (line ~106).
- Add same link in footer Platform nav between Features and Pricing.

## 3. Edit `src/App.tsx`
- Add `const About = lazy(() => import("./pages/About"));`
- Add `<Route path="/about" element={<About />} />` in public routes.

## 4. Edit `public/sitemap.xml`
- Add `<url><loc>https://edzenai.com/about</loc></url>` entry so the new page is indexable.

## Technical notes
- No new dependencies. Uses existing: `react-router-dom`, `lucide-react`, shadcn `Button`/`Card`, `usePageMeta`.
- All colors via semantic tokens (`bg-background`, `text-foreground`, `text-primary`, `bg-secondary`, `border-border`). No raw hex.
- Mobile-first: stack on `sm`, row on `md`.
- Page-level `<h1>` once; sections use `<h2>`.
