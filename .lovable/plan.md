

## Plan: Modern Hero Section with Product Screenshot Placeholder

### What changes

**File: `src/pages/Index.tsx`** — Replace the existing Hero section (lines 64-92) with an enhanced version that includes:

1. **Product screenshot placeholder** — A macOS-style browser mockup frame below the headline containing a gradient placeholder with the EdZen AI logo and "Dashboard Preview" label, styled with rounded corners, a subtle shadow, and a perspective tilt for visual depth.

2. **Bolder headline** — Larger typography with a gradient text accent on the key phrase (e.g., "AI-Powered" in a teal-to-blue gradient).

3. **Trust indicators row** — Small logos/badges below the CTA (e.g., "NEP 2020 Aligned", "500+ Schools", "CBSE · ICSE · State Boards") for social proof.

4. **Primary CTA preserved** — "Start Free 30-Day Trial" button stays prominent with the existing "Book Demo" secondary button.

### Layout

```text
┌──────────────────────────────────────┐
│  Badge: "AI-Powered School Mgmt"     │
│                                      │
│  Run Your School Smarter             │
│  with AI                             │
│  (subtitle paragraph)               │
│                                      │
│  [Start Free Trial]  [Book Demo]     │
│  "No credit card · Indian schools"   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ● ● ●   EdZen AI Dashboard    │  │
│  │┌──────────────────────────────┐│  │
│  ││                              ││  │
│  ││   (gradient placeholder      ││  │
│  ││    with logo + text)         ││  │
│  ││                              ││  │
│  │└──────────────────────────────┘│  │
│  └────────────────────────────────┘  │
│                                      │
│  NEP 2020 · CBSE · ICSE · 500+      │
└──────────────────────────────────────┘
```

### Technical details

- The screenshot mockup uses pure CSS (no images): a `div` with traffic-light dots, a title bar, and an inner area with a `bg-gradient-to-br from-primary/10 via-primary/5 to-background` placeholder. A subtle `transform: perspective(1000px) rotateX(2deg)` adds depth.
- Headline uses `bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent` for the accent words.
- Responsive: stacks cleanly on mobile, mockup scales down gracefully.
- One file changed, no new dependencies.

