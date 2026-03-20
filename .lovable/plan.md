

# 2-Tier Subscription Plan: Starter & Pro

## Overview

Add a `subscription_plan` column to the `schools` table and build a centralized feature gating system. Parent Link is included in **Starter**. AI Excel Import is in **Starter** (onboarding tool). Limited AI class summary (2-3/month) in Starter as a teaser. Full AI, Progress module, and advanced reports are **Pro-only**.

---

## Final Feature Split

### Starter (Core Operations + AI Taste)
- Student CRUD, manual bulk upload
- Fee management (categories, structures, installments, payments, proofs)
- Attendance marking, record leave
- Academic years, student promotion
- Teacher accounts
- Parent Link generation, Telegram integration
- Parent View (fees + attendance)
- School settings, QR code, password change
- Basic reports (class-wise, student-pending, month-wise — view only)
- **AI Excel Import** (onboarding friction reducer)
- **AI Class Summary** (2-3 per month, usage-tracked)

### Pro (Starter + Intelligence)
- Unlimited AI Insights (student-level deep analysis)
- PTM Summary generation
- Progress Module (subjects, assessments, marks entry, competency tracking)
- Assessment Templates (terms, components, grade mappings)
- NEP 2020 Report Cards
- Performance Charts (trend, radar, distribution, comparison)
- At-Risk Detection & Learning Gaps
- CSV/PDF Exports (when built)

---

## Billing System (Per-Student Pricing) ✅ IMPLEMENTED

### Database
- `subscription_pricing` table: per-plan defaults (per_student_fee, base_monthly_fee)
- `schools.custom_per_student_fee`: optional per-school override
- `schools.discount_percent`: school-level discount

### Formula
`total_fee = (student_count × effective_rate) + base_fee - discount`

### Platform Admin
- Subscription Settings page (`/platform/subscription-settings`)
- Schools table shows: Students, Rate, Monthly Fee columns
- Monthly Revenue stat card
- Edit dialog includes pricing override + discount + billing preview

### School Admin
- Settings → Subscription tab shows plan, rate, student count, fee breakdown, renewal dates

---

## Implementation Status

| Step | Status |
|------|--------|
| Step 1: Database Migration (subscription_plan + ai_usage_log) | ✅ Done |
| Step 2: plan-features.ts config | ✅ Done |
| Step 3: useSubscriptionStatus refactor | ✅ Done |
| Step 4: useAIUsage hook | ✅ Done |
| Step 5: ActivateSchoolDialog plan selector | ✅ Done |
| Step 6: UI Gating (AdminLayout, ProgressLayout, SubscriptionBanner) | ✅ Done |
| Step 7: Edge Function Guards (analyze-progress) | ✅ Done |
| Step 8: Platform Dashboard Updates | ✅ Done |
| Billing: subscription_pricing table + school columns | ✅ Done |
| Billing: Subscription Settings page | ✅ Done |
| Billing: Platform Dashboard billing columns + revenue | ✅ Done |
| Billing: EditSchoolDialog pricing override | ✅ Done |
| Billing: School admin Subscription tab | ✅ Done |

---

## Remaining / Future
- RestrictedOverlay plan-based messaging for AI panels
- Upgrade prompt component (Starter → Pro)
- CSV/PDF export gating
- Self-signup with plan selection
- Enterprise tier placeholder
