

# AI Help Assistant for EduTrack Admins

## What We're Building

A floating AI chatbot widget available on all admin pages. Admins can ask questions about fee setup, student management, report cards, attendance, and other EduTrack features. The assistant uses Lovable AI (Gemini) with a detailed system prompt containing full product knowledge.

## Architecture

```text
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  React Chat Widget  │────▶│  Edge Function       │────▶│  Lovable AI     │
│  (floating bubble)  │◀────│  /help-assistant      │◀────│  Gateway        │
│  in AdminLayout     │     │  (streaming SSE)     │     │  (Gemini Flash) │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
```

## Plan

### 1. Create edge function `supabase/functions/help-assistant/index.ts`
- Accepts `{ messages }` from the client
- Adds a comprehensive system prompt with EduTrack product knowledge covering:
  - Fee setup flow (categories, structures, installments, class assignments, auto-assignment)
  - Student management (add, edit, bulk import, promote, parent links)
  - Academic years and enrollment
  - Report cards, assessments, marks entry, competencies
  - Attendance tracking
  - Teacher management
  - Subscription plans (Starter vs Pro)
  - Settings (school info, UPI/QR, logo)
- Streams response via SSE using Lovable AI Gateway
- Model: `google/gemini-3-flash-preview`

### 2. Create `src/components/admin/HelpChatbot.tsx`
- Floating chat bubble (bottom-right corner) with a help/sparkles icon
- Expandable chat panel with message history
- Token-by-token streaming display using SSE parsing
- Markdown rendering for AI responses via `react-markdown`
- Persists conversation in component state (resets on page navigation or close)
- Mobile-responsive (full-width on small screens)

### 3. Integrate into AdminLayout
- Import and render `<HelpChatbot />` inside `AdminLayout` so it appears on all admin pages
- No database tables needed — conversation is ephemeral (client-side only)

## Technical Details

- **No new database tables** — chat is stateless/ephemeral
- **No new secrets** — uses existing `LOVABLE_API_KEY`
- **System prompt** will be ~2000 words of product knowledge baked into the edge function, not editable by end users
- **Rate limit handling** — 429/402 errors surfaced as toast messages
- Uses existing shadcn/ui components (Button, Card, ScrollArea) plus `react-markdown` for rendering

