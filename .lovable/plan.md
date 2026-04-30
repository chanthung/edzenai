## Goal

Make `/view/:name/:token` (the parent portal) load reliably on 3G/4G in low-coverage areas by drastically cutting initial JavaScript and reducing network round-trips.

## Current situation (analysis)

The parent page is **not light** today. It works on good networks but is heavy for rural 3G.

**Bundle issues** (every parent currently downloads all of this on first visit):
- `src/App.tsx` statically imports **every page** in the app — admin dashboard, platform admin, partner portal, all progress module pages, report card editor, settings, etc. With no code splitting, a parent gets the whole SPA.
- Heavy libraries pulled into the main bundle that a parent never needs:
  - `xlsx` (~900 KB) — only used by admin Excel import/export
  - `@huggingface/transformers` (multi-MB) — only used by `lib/bg-remove.ts` for QR background removal in admin
  - `jspdf` + `html2canvas` (~550 KB) — only used in report cards / template export
  - `@googlemaps/js-api-loader` — only used in admin school profile
  - `recharts` (~400 KB) — only needed on Progress tab
  - `embla-carousel`, `react-markdown`, `react-day-picker`, `cmdk`, `vaul`, `input-otp`, full Radix set
- `vite.config.ts` has no `build.rollupOptions.output.manualChunks`, so everything ships as one big vendor chunk.
- No preconnect / DNS-prefetch hints to the Supabase host in `index.html`.

**Network issues on the parent page itself**:
- `useParentView` fires **4 sequential** Supabase queries (student RPC → school → student_fees → payments → payment_proofs). On 300ms RTT 3G that's ~1.5s just in serial waits.
- Progress and Attendance hooks fire on tab mount even though parents land on Fees tab — but their *code* is loaded up-front because `ParentView.tsx` statically imports `ParentProgressTab` and `ParentAttendanceTab`, dragging recharts into the initial bundle.
- School QR code image is rendered at original upload size (could be a 1–2 MB photo) with no width/quality cap.

**Estimated impact**: initial JS for `/view/...` is likely 1.5–3 MB uncompressed (~500–900 KB gzipped). On a real 3G connection (~400 Kbps effective) that is 10–20 seconds before anything is interactive — exactly what you want to avoid.

## Plan

### 1. Route-level code splitting (biggest win)

In `src/App.tsx`, convert all route components to `React.lazy(() => import(...))` and wrap `<Routes>` in a `<Suspense fallback={...}>`. Keep `ParentView`, `Login`, `Index` lazy too. Result: a parent only downloads the parent route's JS, not the admin/platform/partner/progress code.

### 2. Lazy-load tabs inside ParentView

In `src/pages/parent/ParentView.tsx`:
- `ParentFeesTab` stays eager (default tab).
- `ParentProgressTab` and `ParentAttendanceTab` become `React.lazy` and wrapped in `<Suspense>` inside their `<TabsContent>`. This pulls **recharts out of the initial parent bundle entirely** — it only loads if the parent actually taps Progress.

### 3. Lazy-load charts inside ParentProgressTab

Even within Progress, `PerformanceTrendChart`, `SubjectRadarChart`, and `SubjectComparisonChart` become `React.lazy`. Each chart only downloads when it actually has data to render.

### 4. Vite chunk strategy

Add `build.rollupOptions.output.manualChunks` to `vite.config.ts` to split:
- `react-vendor`: react, react-dom, react-router-dom
- `radix`: all `@radix-ui/*`
- `charts`: recharts (so it's a separate cacheable chunk)
- `heavy`: xlsx, jspdf, html2canvas, @huggingface/transformers, @googlemaps/js-api-loader (parent never touches this chunk)
- `supabase`: @supabase/supabase-js, @tanstack/react-query

This guarantees the heavy admin-only libs cannot leak into the parent bundle.

### 5. Parallelize parent data fetch

Refactor `src/hooks/useParentView.ts`: after the access-token RPC resolves the student, run `school`, `student_fees`, `payments`, and `payment_proofs` in `Promise.all`. Cuts ~3 RTTs down to 1 — saves roughly 1 second on a 300ms-RTT link.

### 6. Network hints in `index.html`

Add to `<head>`:
```
<link rel="preconnect" href="https://fwnvfkaihuqdfdcwkakj.supabase.co" crossorigin>
<link rel="dns-prefetch" href="https://fwnvfkaihuqdfdcwkakj.supabase.co">
```
Lets the TLS handshake to the backend happen in parallel with the JS download.

### 7. Cap the QR image size

In `ParentFeesTab.tsx`, add `loading="lazy"` and `decoding="async"` to the QR `<img>`. The image is already constrained to `w-24 h-24` visually but the file itself can be huge — also add a `max-width: 200px` style cap so browsers can opt into responsive scaling, and document that admins should upload QR images ≤100 KB (no code change required for the admin upload, just a follow-up note).

### 8. React Query cache tuning for parent

In `useParentView`, set `staleTime: 60_000` and `gcTime: 5 * 60_000` so a parent who taps between tabs doesn't refetch.

## Expected outcome

- Initial JS for `/view/:name/:token` drops from ~500–900 KB gzipped to roughly **120–180 KB gzipped** (React + Router + Radix Tabs + Supabase + Fees tab only).
- Time-to-interactive on a real 3G connection (~400 Kbps, 300 ms RTT): from ~10–20 s down to ~3–5 s.
- Progress tab still works — it just downloads recharts on demand (one-time, then cached).
- No visible UI change for parents on good networks.

## Files to change

- `src/App.tsx` — convert all routes to `React.lazy` + add `<Suspense>`
- `src/pages/parent/ParentView.tsx` — lazy Progress and Attendance tabs
- `src/components/parent/ParentProgressTab.tsx` — lazy chart imports
- `src/components/parent/ParentFeesTab.tsx` — `loading="lazy"` on QR `<img>`
- `src/hooks/useParentView.ts` — parallelize queries + cache tuning
- `vite.config.ts` — add `manualChunks`
- `index.html` — add preconnect/dns-prefetch to Supabase host

## Out of scope (can be follow-ups)

- Service worker / offline cache for repeat parent visits.
- Server-side compression of uploaded QR images on the admin side.
- Replacing recharts with a lighter chart lib for the parent view.
