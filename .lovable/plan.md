## Smart Promotion Engine — EdZen AI  
Ensure the system's current code and functionality are not disturbed.  
There is existing rule that requires all fees are cleared before collecting report card. WhatsApp reminder needed here.

The uploaded document specifies a board-aware, audited, one-click year-end promotion engine. EdZen already has a basic Promotions tab (`src/components/admin/PromoteStudentsTab.tsx` under `Academic Years → Promotions`) with auto-suggestions (Promote/Retain/Exclude) based on average %. This plan extends that into the full Smart Promotion Engine, with two extra emphases you flagged:

1. **Board-Specific Rules must be editable** (per school, per board, per class range).
2. **Promoted student list must be printable** (post-run report).

Out of scope to keep this shippable: WhatsApp send (we'll stage the template + log intent only — actual send can be wired later via existing WhatsApp integration), and the 24-hour Undo lock (we will store undo metadata but cap UI to the same run-window as today).   
- Keep WhatsApp send optional (Only  for promotion)

---

### What you'll see in the app

**A. Settings → Promotion Rules (new page)**

- Pick the school's **Board**: CBSE / ICSE / State / Custom.
- Pre-loaded defaults from the doc (Class 1–8, 9–10, 11, 12 for CBSE; ICSE/ISC variants; State default 35%).
- For each class range, editable fields:
  - Min % per subject, Min theory %, Min practical %, Min internal %
  - English compulsory (toggle)
  - Grace marks allowed (number)
  - Max failed subjects = compartment (e.g., 1) vs fail (e.g., 2+)
  - "Best of N" rule (ICSE) toggle + N
  - Board-exit year toggle (disables promotion, e.g., Class 12)
- "Restore board defaults" button per range.
- Add custom per-subject rule (e.g., Maths min 40%).

**B. Academic Years → Promotions tab (upgraded)**
The current 3-state suggestion becomes a 3-status evaluation driven by the editable rules:

- 🟢 **Qualifies** — auto-promote candidate
- 🟡 **Review Needed** — grace-eligible, 1-subject compartment, missing marks, attendance < 75 %, RTE Class 1–8 hold-back, etc.
- 🔴 **Does Not Qualify** — retain
Each row shows: avg %, failing subjects, rule that triggered the status, and an admin override (Promote / Retain / Exclude / Compartment) with required reason for any override on a 🟡/🔴 student.

**C. Confirmation modal (5 consent checkboxes)**
Confirm button stays disabled until admin checks: marks final, parents will be notified, action is logged, hold-backs have parental consent, next year exists. Records IP + admin name + timestamp.

**D. Post-run report — printable**
After Confirm, a results screen lists every promoted student grouped by destination class with:

- Name, roll, current → new class/section, final %, status badge.
- "Print Promoted Students" → opens a print-optimized view (browser print → save as PDF works) with school header, year, signature line.
- "Export Promoted XLSX" using existing `exportToXLSX`.
- Same for Held-back list (separate print sheet).

**E. Audit log**
A `promotion_runs` record with snapshot of rules used + per-student outcomes, viewable from Settings → Promotion Rules → "History".

---

### Technical implementation

**New tables (migration):**

- `promotion_rules` — `id, school_id, board, class_range ('1-8'|'9-10'|'11'|'12'), min_subject_pct, min_theory_pct, min_practical_pct, min_internal_pct, english_compulsory, grace_marks, max_compartment_subjects, best_of_n, is_board_exit, custom_rules jsonb`. RLS by `school_id`.
- `promotion_runs` — `id, school_id, from_year_id, to_year_id, initiated_by, initiated_at, ip_address, rules_snapshot jsonb, consent jsonb, status`. RLS by `school_id`.
- `promotion_outcomes` — `id, run_id, student_id, from_class, to_class, final_pct, failing_subjects jsonb, status ('promoted'|'retained'|'compartment'|'excluded'), override_reason, auto_status`. RLS via `run_id → school_id`.
- Add columns to `students`: `previous_class TEXT`, `last_promoted_at TIMESTAMPTZ`, `last_promotion_run_id UUID`.

**New files:**

- `src/lib/promotion-rules.ts` — board defaults + evaluator function `evaluateStudent(marks, rules) → { status, reason, failingSubjects }`.
- `src/hooks/usePromotionRules.ts` — CRUD on `promotion_rules`.
- `src/pages/admin/PromotionRules.tsx` — settings UI; route `/admin/settings/promotion-rules` (or as a tab under Settings).
- `src/components/admin/PromotionConfirmDialog.tsx` — 5-checkbox modal.
- `src/components/admin/PromotionResultReport.tsx` — printable post-run report (uses `@media print` styles + a print button).
- `src/components/admin/PromotionHistory.tsx` — list past runs.

**Files edited:**

- `src/components/admin/PromoteStudentsTab.tsx` — replace simple `getPromotionStatus` logic with `evaluateStudent` driven by saved rules; add Status column + override-reason input; route Confirm through new confirm dialog and persist a `promotion_runs` + `promotion_outcomes` set; on success show `PromotionResultReport`.
- `src/pages/admin/Settings.tsx` — add "Promotion Rules" entry.
- `src/App.tsx` — register new route.
- `src/lib/grade-promotion.ts` — keep `getNextClass`; mark `getPromotionStatus` deprecated.

**Print implementation:**
Standard print stylesheet (`@media print`) on `PromotionResultReport`: hides chrome, shows school logo + name from `useSchool`, paginates by destination class, signature footer. No PDF library needed — browser "Print → Save as PDF" produces a clean printable doc; XLSX export piggybacks on `exportToXLSX`.

**Defaults seeded client-side** so a school with no rules row still gets correct CBSE/ICSE/State behaviour; rows are written only when admin edits.

---

### Plan of work

```text
1. Migration: promotion_rules, promotion_runs, promotion_outcomes (+ RLS) and students columns
2. Add board defaults + evaluator in src/lib/promotion-rules.ts
3. Build Settings → Promotion Rules editor (per board, per class range, per-subject custom rules)
4. Refactor PromoteStudentsTab to use evaluator + 3 statuses + override reasons
5. Add 5-checkbox PromotionConfirmDialog (records IP via edge function or `navigator`, admin id, timestamp)
6. Persist run + outcomes; update students.previous_class / last_promoted_at
7. Build PromotionResultReport with print stylesheet + Print + Export XLSX (promoted + held-back tabs)
8. Add PromotionHistory view from Settings → Promotion Rules
9. (Stub) WhatsApp template preview screen — message body only, send disabled with "Coming soon" if Mayavi not configured (WhatsApp send optional. only Admins can manually Bulk send. Parents collect hard copy of report card from campus)
```

Approve this and I'll implement it end-to-end.