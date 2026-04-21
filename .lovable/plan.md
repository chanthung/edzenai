

## AI opportunities — Assessment Templates + system-wide audit

### Yes, AI can absolutely help in Assessment Templates

Today the user manually types every term, every component, every grade band. That's tedious and error-prone — most schools follow a standard board pattern (CBSE / ICSE / State boards / Cambridge). One AI prompt can produce the whole thing in 5 seconds.

### Proposed: "Generate with AI" button in Assessment Templates

Top-right of the Template Editor, next to "Save Template":

```text
[ ✨ Generate with AI ]   [ 💾 Save Template ]
```

Opens a small dialog:

```text
Tell me about your assessment system
─────────────────────────────────────
Examples you can type:
  "CBSE Class 6-10 with FA1, FA2, SA1, SA2"
  "ICSE primary, 3 terms, internal + external"
  "Cambridge IGCSE with coursework + final exam"
  "Maharashtra State Board Std 5-8"
  "Montessori — 3 terms, descriptive grades only"

[ Free-text input box ]
[ Generate ] [ Cancel ]
```

**What AI returns (one Lovable AI Gateway call to `google/gemini-2.5-flash`):**
- Suggested template name
- Grading type (`percentage` or `custom_grades`)
- Terms list (e.g. FA1, FA2, SA1, SA2 / Term 1, Term 2, Final)
- Mark components with max marks (Internal 20, External 80, etc.)
- Grade mappings (A+/A/B/C… with the right cut-offs for that board)

User reviews everything in the existing editor and can edit anything before saving. Nothing auto-commits.

**File:** new edge function `generate-assessment-template` + a small `GenerateTemplateDialog.tsx` mounted in `TemplateEditor.tsx`. Schema-locked tool-call response so the structure is always valid.

---

### System-wide AI audit — what's already AI-powered

✅ Student Excel import (`process-student-excel` — column mapping)
✅ Fee Excel import (`process-fee-excel`)
✅ Payment proof OCR (just shipped)
✅ Progress analysis (`analyze-progress` — student insights)
✅ Help chatbot (`help-assistant`)

### High-value AI additions ranked by impact

**🔥 Tier 1 — biggest time-savers**

1. **Assessment Template generator** (above) — saves 10-15 min per template
2. **Fee Structure generator** — "₹45,000/year tuition + ₹3,000 books, split into 2 installments due Apr & Oct" → auto-creates categories, structures, installments
3. **AI Reject Reason composer for payment proofs** — admin clicks 🤖 → AI drafts a polite, parent-friendly rejection message based on the comparison panel mismatch (currently they pick a canned reason)

**⚡ Tier 2 — quality-of-life**

4. **Smart Bulk WhatsApp message composer** — admin types intent ("remind unpaid Class 5 parents about Term 2 fees due next week"), AI drafts the message in chosen language (English / Hindi / regional)
5. **AI report card comments** — auto-generate teacher remarks per subject based on marks + attendance + competency scores (huge time-saver during reporting season)
6. **Parent question auto-responder** (parent view) — small "Ask about my child" box answers fee/attendance/progress questions from the data already loaded for that token

**💡 Tier 3 — nice to have**

7. **AI exam paper question bank** — generate practice questions per subject + class + chapter (NEP-aligned)
8. **Onboarding assistant** — replaces the static 4-step wizard with a conversational "Tell me about your school" flow that pre-fills classes, fee structure, templates
9. **Anomaly alerts on dashboard** — AI watches collection trends and surfaces "Class 7 collections dropped 40% this month vs last" type insights

---

### Recommendation for THIS turn

Implement only **#1 (Assessment Template generator)** now — it's the most-requested area you just asked about, fully scoped, one edge function + one dialog, no DB changes. The rest stay on the roadmap and we tackle one per request.

### What to build now

- New edge function: `supabase/functions/generate-assessment-template/index.ts` (Gemini 2.5 Flash, tool-call schema)
- New component: `src/components/admin/templates/GenerateTemplateDialog.tsx`
- Modified: `src/components/admin/templates/TemplateEditor.tsx` — add "✨ Generate with AI" button + wire results into existing form state (terms, components, grading type, name)
- No DB migration, no changes to existing save flow

### Safety
- AI output populates the form only — user must click Save Template to commit
- All fields remain fully editable
- Schema-locked AI response prevents malformed data
- Falls back gracefully if AI is unavailable (existing manual flow untouched)

### Want a different pick?
If you'd rather start with **AI report card comments** (#5 — arguably the biggest teacher time-saver) or the **Fee Structure generator** (#2), say the word and I'll re-plan around that instead.

