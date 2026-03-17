

# Competency-Based Learning Outcomes (Gap 3)

## What We're Building

A system where each subject has defined competencies (skills/learning outcomes), and student marks can be tracked against those competencies -- enabling teachers to see which specific skills a student has mastered vs. needs work on.

## Database Changes

### New table: `competencies`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| subject_id | uuid | FK to subjects |
| school_id | uuid | For RLS |
| name | text | e.g. "Number Sense", "Reading Comprehension" |
| description | text | Optional detail |
| display_order | integer | Sorting |
| created_at | timestamptz | Default now() |

### New table: `student_competency_scores`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK to students |
| competency_id | uuid | FK to competencies |
| assessment_id | uuid | FK to assessments |
| mastery_level | enum | `beginning`, `developing`, `proficient`, `advanced` |
| score | numeric | Optional numeric score |
| remarks | text | Teacher notes |
| created_at | timestamptz | Default now() |

### New enum: `mastery_level`
Values: `beginning`, `developing`, `proficient`, `advanced`

### RLS Policies
- Same pattern as subjects/student_marks: admin full access via `get_user_school_ids()`, teacher access via `get_teacher_school_ids()`, public SELECT for parent view.

## UI Changes

### 1. Competency Management (on Subjects page)
- Add a "Manage Competencies" button next to each subject
- Opens a dialog/panel to add/edit/delete competencies for that subject
- Simple list with name, description, drag-to-reorder

### 2. Competency Scoring (on Marks Entry page)
- After entering marks for a subject, show a "Competency Assessment" section
- For each competency of the selected subject, show a mastery level selector (Beginning / Developing / Proficient / Advanced) per student
- Optional remarks field

### 3. Competency View (on Student Progress page)
- New "Competencies" tab/section showing mastery levels across subjects
- Color-coded badges: Beginning (red), Developing (amber), Proficient (green), Advanced (blue)
- Radar/heatmap showing competency mastery across subjects

### 4. Report Card Integration
- Add competency mastery summary to existing report card view
- Show per-subject competency breakdown with mastery level indicators

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create enum, tables, RLS policies |
| `src/hooks/progress/useCompetencies.ts` | New - CRUD for competencies |
| `src/hooks/progress/useCompetencyScores.ts` | New - CRUD for student scores |
| `src/components/progress/CompetencyManager.tsx` | New - manage competencies per subject |
| `src/components/progress/CompetencyScoring.tsx` | New - mastery level entry per student |
| `src/components/progress/CompetencyView.tsx` | New - student competency overview |
| `src/pages/progress/Subjects.tsx` | Add "Manage Competencies" button |
| `src/pages/progress/MarksEntry.tsx` | Add competency scoring section |
| `src/pages/progress/StudentProgress.tsx` | Add competency tab |
| `src/components/progress/ReportCardView.tsx` | Add competency section |
| `supabase/functions/analyze-progress/index.ts` | Include competency data in AI prompts |

