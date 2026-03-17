

# Board-Agnostic Assessment & Reporting System — Implementation Plan

This is a large, multi-phase feature. I recommend breaking it into **4 phases** to deliver incrementally without breaking existing functionality.

---

## Phase 1: Assessment Templates (Database + Settings UI)

### New Database Tables

**`assessment_templates`** — Reusable template definitions
- `id`, `school_id`, `name` (e.g. "ICSE Primary", "CBSE Term System"), `grading_type` (enum: `percentage`, `custom_grades`), `is_default`, `created_at`

**`template_terms`** — Terms within a template
- `id`, `template_id`, `name` (e.g. "Term 1", "Final"), `display_order`

**`template_components`** — Mark components per template
- `id`, `template_id`, `name` (e.g. "Internal", "External", "Project"), `max_marks`, `display_order`

**`template_grade_mappings`** — Custom grade rules
- `id`, `template_id`, `min_percentage`, `max_percentage`, `grade_label` (e.g. "A+", "A", "B+"), `numerical_grade` (optional)

**`class_template_assignments`** — Links templates to classes per academic year
- `id`, `school_id`, `template_id`, `class_name`, `academic_year_id`

**`component_marks`** — Raw per-component marks (extends existing `student_marks`)
- `id`, `student_mark_id` (FK → student_marks), `component_id` (FK → template_components), `marks_obtained`

All tables get RLS policies scoped to `school_id` via `get_user_school_ids()` and `get_teacher_school_ids()`.

### New Settings Page Section
- Add "Assessment Templates" tab/section to admin Settings page
- CRUD UI for templates: name, grading type, terms list, components list (name + max marks), grade mappings
- "Assign to Class" feature: select class + academic year → link template
- Reusable across sessions (template persists, assignment is per-year)

### Files to create/modify
- New migration SQL for all tables above
- `src/hooks/progress/useAssessmentTemplates.ts` — CRUD hooks
- `src/pages/admin/Settings.tsx` — Add "Assessment Templates" tab
- `src/components/admin/templates/TemplateEditor.tsx` — Template form
- `src/components/admin/templates/TemplateList.tsx` — List/manage templates
- `src/components/admin/templates/GradeMappingEditor.tsx` — Grade rules editor
- `src/components/admin/templates/ClassAssignment.tsx` — Assign templates to classes

---

## Phase 2: Auto-Loaded Marks Entry with Standardized Engine

### Update Marks Entry Page
- When teacher selects Class → auto-detect assigned template
- Load components from template (e.g. "Internal 60M", "External 40M")
- Teacher enters ONLY raw component marks per student per subject
- System auto-computes in real-time: **Total**, **Percentage**, **Grade**
- Grade derived from template's grading rules (percentage-based or custom mapping)

### Standardized Marks Engine
- On save, store both:
  - Raw component marks in `component_marks`
  - Computed values in `student_marks` (total, percentage, grade)
- Calculation: `total = sum(component marks)`, `percentage = (total / sum(component max_marks)) * 100`, `grade = lookup from template grade mappings`
- Falls back to current simple marks entry if no template assigned (backward compatible)

### Files to create/modify
- `src/pages/progress/MarksEntry.tsx` — Major refactor: detect template, render component columns, auto-compute
- `src/hooks/progress/useStudentMarks.ts` — Update save mutation to include component marks + computed values
- `src/lib/marks-engine.ts` — Pure functions for total/percentage/grade computation

---

## Phase 3: Report Generation System

### Report Card Generator
- New route: `/progress/reports`
- Select: Class → Section → Assessment/Term → Generate
- Dynamic report layout based on template structure

### Report Sections
- **Scholastic**: Subjects with component-wise marks, totals, grades
- **Co-Scholastic**: Grade-only display (subject_type = co_curricular/vocational)
- **Attendance**: Placeholder/manual entry fields (total working days, present days)
- **Summary**: Overall percentage, grade, rank

### Layout System
- Configurable report layouts stored as JSON config
- Pre-built layouts: ICSE-style (component-wise), CBSE-style (term-wise), Generic
- Admin can select layout per template
- Support: Screen view, Print (A4 CSS), PDF export (via browser print or dedicated generation)

### Files to create/modify
- `src/pages/progress/Reports.tsx` — New page
- `src/components/progress/reports/ReportCard.tsx` — Main report renderer
- `src/components/progress/reports/ScholasticSection.tsx`
- `src/components/progress/reports/CoScholasticSection.tsx`
- `src/components/progress/reports/ReportSummary.tsx`
- `src/components/progress/reports/PrintLayout.tsx` — A4 print styles
- `src/lib/report-layouts.ts` — Layout configurations
- Update `ProgressLayout.tsx` nav to include "Reports"
- Update `App.tsx` with new route

---

## Phase 4: Enhanced AI Insights + Alerts & Flags

### Enhanced AI Analysis
- Update `analyze-progress` edge function to accept component-level data
- Add to AI response: `prioritySubject`, `suggestedActions` fields
- Normalize data sent to AI (standardized format regardless of board)

### Alerts & Flags on Dashboard
- Auto-flag: score < 50%, declining trend, missing assessments
- Display as warning icons + status badges (Stable / Declining / Needs Attention)
- Add alert indicators to Progress Dashboard student list
- Add missing-assessment detection (compare expected subjects from template vs actual marks)

### n8n Integration (Optional Enhancement)
- Create new edge function `process-marks` that triggers on marks save
- Posts standardized data to n8n webhook (configurable via secret)
- n8n workflow can compute, enrich, and return AI insights
- Falls back to direct Lovable AI if n8n not configured

### Files to modify
- `supabase/functions/analyze-progress/index.ts` — Enhanced prompts with component data
- `src/hooks/progress/useProgressAnalytics.ts` — Add alert/flag logic
- `src/pages/progress/ProgressDashboard.tsx` — Display alert badges
- `src/components/progress/AlertBadge.tsx` — New component
- New edge function: `supabase/functions/process-marks/index.ts` (optional n8n bridge)

---

## Backward Compatibility
- Existing `student_marks` table untouched — new `component_marks` table extends it
- If no template assigned to a class, Marks Entry works exactly as today
- Existing Progress Dashboard, AI Analysis, PTM reports continue working
- New features layer on top, never replace

## Implementation Order
I recommend implementing **Phase 1 first** (templates DB + UI), then Phase 2 (marks entry), then Phase 3 (reports), then Phase 4 (AI enhancements). Each phase is independently useful.

Shall I proceed with Phase 1?

