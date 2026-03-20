// ─── Subscription Plan Types ───────────────────────────────────────
export type SubscriptionPlan = 'starter' | 'pro';

export type PlanFeature =
  | 'ai_excel_import'
  | 'ai_class_summary'
  | 'ai_student_insights'
  | 'ai_ptm_summary'
  | 'progress_module'
  | 'assessment_templates'
  | 'report_cards'
  | 'performance_charts'
  | 'at_risk_detection'
  | 'csv_pdf_export';

// ─── Feature → Minimum Required Plan ──────────────────────────────
const FEATURE_PLAN_MAP: Record<PlanFeature, SubscriptionPlan> = {
  ai_excel_import: 'starter',
  ai_class_summary: 'starter',
  ai_student_insights: 'pro',
  ai_ptm_summary: 'pro',
  progress_module: 'pro',
  assessment_templates: 'pro',
  report_cards: 'pro',
  performance_charts: 'pro',
  at_risk_detection: 'pro',
  csv_pdf_export: 'pro',
};

// ─── Usage Limits (per month, null = unlimited) ───────────────────
const FEATURE_LIMITS: Partial<Record<PlanFeature, Record<SubscriptionPlan, number | null>>> = {
  ai_class_summary: {
    starter: 3,
    pro: null, // unlimited
  },
};

// ─── Plan Hierarchy (higher index = more access) ──────────────────
const PLAN_HIERARCHY: SubscriptionPlan[] = ['starter', 'pro'];

// ─── Public API ───────────────────────────────────────────────────

export function canAccessFeature(plan: SubscriptionPlan, feature: PlanFeature): boolean {
  const requiredPlan = FEATURE_PLAN_MAP[feature];
  return PLAN_HIERARCHY.indexOf(plan) >= PLAN_HIERARCHY.indexOf(requiredPlan);
}

export function getFeatureLimit(plan: SubscriptionPlan, feature: PlanFeature): number | null {
  const limits = FEATURE_LIMITS[feature];
  if (!limits) return null; // no limit defined → unlimited
  return limits[plan] ?? null;
}

export function getRequiredPlan(feature: PlanFeature): SubscriptionPlan {
  return FEATURE_PLAN_MAP[feature];
}

// ─── Display Info ─────────────────────────────────────────────────

export interface PlanDisplayInfo {
  label: string;
  description: string;
  badge: string;
  colorClass: string;
  features: string[];
}

export const PLAN_DISPLAY: Record<SubscriptionPlan, PlanDisplayInfo> = {
  starter: {
    label: 'Starter',
    description: 'Core school operations — students, fees, attendance, and reports',
    badge: 'Starter',
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    features: [
      'Student management & bulk upload',
      'Fee categories, structures & payments',
      'Attendance marking & leave records',
      'Academic years & promotions',
      'Teacher accounts',
      'Parent Link & Telegram',
      'Basic reports (view only)',
      'AI Excel Import',
      'AI Class Summary (3/month)',
    ],
  },
  pro: {
    label: 'Pro',
    description: 'Full intelligence suite — AI insights, progress tracking, and advanced analytics',
    badge: 'Pro',
    colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    features: [
      'Everything in Starter',
      'Unlimited AI Insights',
      'PTM Summary generation',
      'Subjects, assessments & marks entry',
      'Competency tracking',
      'Assessment Templates',
      'NEP 2020 Report Cards',
      'Performance charts & analytics',
      'At-Risk detection & learning gaps',
      'CSV/PDF exports',
    ],
  },
};

// ─── All Features List (for UI display) ───────────────────────────

export const ALL_FEATURES: { feature: PlanFeature; label: string; description: string }[] = [
  { feature: 'ai_excel_import', label: 'AI Excel Import', description: 'Smart column mapping for student uploads' },
  { feature: 'ai_class_summary', label: 'AI Class Summary', description: 'AI-generated class performance analysis' },
  { feature: 'ai_student_insights', label: 'AI Student Insights', description: 'Deep individual student analysis' },
  { feature: 'ai_ptm_summary', label: 'PTM Summary', description: 'AI-generated parent-teacher meeting reports' },
  { feature: 'progress_module', label: 'Progress Module', description: 'Subjects, assessments, and marks entry' },
  { feature: 'assessment_templates', label: 'Assessment Templates', description: 'Custom grading templates with terms and components' },
  { feature: 'report_cards', label: 'Report Cards', description: 'NEP 2020-aligned report card generation' },
  { feature: 'performance_charts', label: 'Performance Charts', description: 'Trend, radar, and distribution charts' },
  { feature: 'at_risk_detection', label: 'At-Risk Detection', description: 'Student monitoring and learning gap analysis' },
  { feature: 'csv_pdf_export', label: 'CSV/PDF Export', description: 'Downloadable reports and data exports' },
];
