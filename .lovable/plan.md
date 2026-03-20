

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

## Implementation Steps

### Step 1: Database Migration
- Add `subscription_plan` column to `schools` table as text, default `'starter'`
- Create an `ai_usage_log` table to track Starter AI usage (school_id, feature, used_at)

```sql
ALTER TABLE schools ADD COLUMN subscription_plan text NOT NULL DEFAULT 'starter';
CREATE TABLE ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  feature text NOT NULL,
  used_at timestamptz DEFAULT now()
);
-- RLS on ai_usage_log for school admins
```

### Step 2: Create `src/config/plan-features.ts`
Central config mapping features to required plan tiers:

```text
type SubscriptionPlan = 'starter' | 'pro';
type PlanFeature = 
  | 'ai_excel_import'        → starter
  | 'ai_class_summary'       → starter (usage-limited)
  | 'ai_student_insights'    → pro
  | 'ai_ptm_summary'         → pro
  | 'progress_module'        → pro
  | 'assessment_templates'   → pro
  | 'report_cards'           → pro
  | 'performance_charts'     → pro
  | 'at_risk_detection'      → pro
  | 'csv_pdf_export'         → pro

Export: canAccessFeature(plan, feature) → boolean
Export: getFeatureLimit(plan, feature) → number | null
Export: PLAN_DISPLAY_INFO (labels, colors, descriptions)
```

### Step 3: Refactor `useSubscriptionStatus`
- Fetch `subscription_plan` from schools table
- Expose `currentPlan: SubscriptionPlan`
- Add `canAccessFeature(feature)` method using the config
- Keep existing `canPerform(action)` for restriction-mode (orthogonal concern)

### Step 4: Create `useAIUsage` hook
- Query `ai_usage_log` for current month count per feature
- Expose `hasRemainingUsage(feature)` and `usageCount`
- Used by Starter schools to check AI class summary limits

### Step 5: Update `ActivateSchoolDialog`
- Add plan selector (Starter / Pro) with visual cards
- Show per-student pricing for each plan
- Allow pricing override field
- Save selected plan to `schools.subscription_plan`

### Step 6: UI Gating Updates

**AdminLayout sidebar**: Add plan badge next to school name (Starter/Pro)

**SubscriptionBanner**: Show plan info and upgrade prompts

**Progress module nav item** in AdminLayout: Show lock icon for Starter schools, clicking shows upgrade prompt instead of navigating

**ProgressLayout**: Gate entire layout — if Starter, show a full-page "Upgrade to Pro" prompt

**AI components** (AIInsightsPanel, BulkStudentUpload AI toggle): Check `canAccessFeature()`, show locked overlay with upgrade message for restricted features

**RestrictedOverlay**: Extend to support plan-based restriction messaging ("Upgrade to Pro to unlock this feature")

### Step 7: Edge Function Guards
- **`analyze-progress`**: Query school's `subscription_plan` before processing. Allow Starter only for class-level with usage limit check. Reject if limit exceeded.
- **`process-student-excel`**: Allow for all plans (Starter includes AI import)

### Step 8: Platform Dashboard Updates
- Show `subscription_plan` column in schools table
- Add plan badge using `SystemStateBadge` pattern
- Allow plan changes from EditSchoolDialog

---

## Files Modified/Created

| File | Change |
|------|--------|
| `supabase/migrations/` | New migration for `subscription_plan` column + `ai_usage_log` table |
| `src/config/plan-features.ts` | **New** — central feature-to-plan mapping |
| `src/hooks/useSubscriptionStatus.ts` | Add `currentPlan`, `canAccessFeature()` |
| `src/hooks/useAIUsage.ts` | **New** — track AI usage for Starter limits |
| `src/contexts/RestrictionContext.tsx` | Expose plan info |
| `src/components/platform/ActivateSchoolDialog.tsx` | Add plan selector |
| `src/components/platform/EditSchoolDialog.tsx` | Add plan change option |
| `src/components/admin/AdminLayout.tsx` | Plan badge, lock Progress nav for Starter |
| `src/components/admin/SubscriptionBanner.tsx` | Plan-aware messaging |
| `src/components/admin/RestrictedOverlay.tsx` | Support plan-based restriction |
| `src/components/progress/ProgressLayout.tsx` | Gate for Pro-only |
| `src/components/progress/AIInsightsPanel.tsx` | Feature gate check |
| `src/components/admin/BulkStudentUpload.tsx` | AI import allowed for all |
| `src/pages/platform/PlatformDashboard.tsx` | Show plan column |
| `supabase/functions/analyze-progress/index.ts` | Plan tier check |
| `src/hooks/useSchool.ts` | Add `subscription_plan` to School type |

---

## Estimated Effort
5-7 implementation messages across database, config, hooks, UI, and edge functions.

