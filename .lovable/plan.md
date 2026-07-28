# Plan: EdZen AI — Interview Q&A Cheat Sheet PDF

Deliverable: a single, print-friendly PDF at `/mnt/documents/edzenai-interview-qa.pdf` — 1–2 pages, ~15 Q&A, 2–3 sentence answers, tuned for a **full-stack / product engineer** interview.

## Content outline (~15 questions)

**Product / Why**
1. What is EdZen AI in one line?
2. Who is it for and why this market?
3. What problem does it actually solve vs Entab/Fedena?

**Architecture / How**
4. What's the stack? (React 18 + Vite + TS + Tailwind + shadcn; Supabase Postgres/Auth/Edge Functions; Lovable AI Gateway → Gemini)
5. How is multi-tenancy handled? (RLS per school_id, `has_role` security-definer, GRANTs)
6. How do parents access data with no login? (UUID `access_token` + slugified URL)
7. How is fee status computed? (derived from payments, not stored)

**AI features**
8. Where does AI live in the product? (progress insights, marks import mapping, help assistant, subject suggest)
9. Why Lovable AI Gateway + Gemini Flash? (single key, low latency, cost, structured output)
10. How do you keep AI cost/output safe? (server-side prompts in edge functions, JSON schema output, usage tracking)

**Integrations & delivery**
11. How do WhatsApp reminders work? (Mayavi InfoTech, 10-digit normalize + trigger, shared helper w/ retries + failure classification)
12. How are payments handled? (Razorpay India / Paddle intl, webhook → subscription state machine)

**Engineering tradeoffs**
13. Biggest tradeoff you made? (derived fee status, no timetable, simple attendance model)
14. How do you handle trial → restricted mode? (`system_state` + `useSubscriptionStatus` + guarded mutations)
15. What would you build next? (AI attendance intelligence, weak-topic prediction, AI parent comms)

Each answer: 2–3 sentences, plain language, one concrete file/table reference where useful.

## How it will be built

1. Use the **pdf skill** (ReportLab + DejaVu font for ₹ symbol) to generate a clean, single-column A4 PDF with:
   - Header: "EdZen AI — Interview Cheat Sheet"
   - Section dividers (Product / Architecture / AI / Integrations / Tradeoffs)
   - Bold question, indented answer
   - Footer: edzenai.com
2. Convert pages to images and visually QA (no clipping, ₹ renders, fits 1–2 pages).
3. Save to `/mnt/documents/edzenai-interview-qa.pdf` and surface with `<presentation-artifact>`.

No code changes to the app. Purely a generated artifact.
