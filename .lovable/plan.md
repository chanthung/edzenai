
# Landing Page Chatbot Widget

Build a new `LandingChatbot` component for the EdZen AI landing page, matching the uploaded design. This is separate from the existing admin `HelpChatbot`.

## What Gets Built

### 1. New Component: `src/components/landing/LandingChatbot.tsx`

**UI (matching the design):**
- Floating purple/blue button (bottom-right corner)
- Chat modal with gradient header: "EdZen AI Assistant" + "Online -- here to help" status
- Auto-greeting message on first open
- 6 quick-action chips: "What is EdZen AI?", "How does fee collection work?", "Pricing?", "Free trial?", "WhatsApp integration?", "CBSE/ICSE support?"
- Input box with placeholder "Ask about EdZen AI..." and send icon
- Close (X) button in header

**Behavior:**
- **Predefined responses first** -- instant replies for the 6 FAQ topics from a hardcoded knowledge base (no network call needed)
- **AI fallback** -- if no FAQ match, call the existing `help-assistant` edge function with a landing-page-specific system prompt
- **CTA injection** -- after 2-3 exchanges, append actionable buttons: "Book Demo" (links to `/book-demo`), "Start Free Trial" (links to `/signup`), "Talk to Sales" (WhatsApp click-to-chat)
- **Lazy load** -- component renders only after page idle (`requestIdleCallback`)
- **Session persistence** -- chat history in `sessionStorage`

### 2. Update Edge Function: `supabase/functions/help-assistant/index.ts`

Add a `context` field to the request body. When `context === "landing"`, prepend a landing-page-specific system prompt that keeps answers short, avoids mentioning internal admin features, and guides toward demo booking.

### 3. Add to Landing Page: `src/pages/Index.tsx`

Lazy-import and render `<LandingChatbot />` at the bottom of the page.

## Technical Details

- Predefined FAQ matching uses simple keyword/intent matching (e.g., "pricing" or "cost" triggers the pricing response)
- Quick-action chips auto-send the mapped question text
- CTA buttons rendered as styled links, not chat messages
- Response caching: predefined answers are instant; AI responses cached in a Map for the session
- Bundle: no new dependencies needed -- reuses existing `react-markdown`, `lucide-react`, UI primitives
- The component will be wrapped in `React.lazy()` + `Suspense` in Index.tsx

## Files Changed

| File | Action |
|------|--------|
| `src/components/landing/LandingChatbot.tsx` | Create |
| `src/pages/Index.tsx` | Edit (add lazy import + render) |
| `supabase/functions/help-assistant/index.ts` | Edit (add landing context prompt) |
