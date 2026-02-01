

# Parent View Academic Progress Tab

This plan adds a second tab to the existing Parent View (accessed via the unique parent link) that displays the student's academic performance with marks and visual charts.

---

## What You'll Get

### Tabbed Parent View Interface
- **Fees Tab** (existing): Current fee statement, payment QR, installment status, proof upload
- **Progress Tab** (new): Academic performance summary, assessment history, subject-wise charts

### Progress Tab Features
1. **Performance Summary Cards**
   - Overall average percentage
   - Total assessments taken
   - Performance trend (improving/stable/declining indicator)
   - Strongest and weakest subjects at a glance

2. **Visual Charts**
   - Performance Trend Line Chart (how student has progressed over time)
   - Subject Strength Radar Chart (multi-subject comparison)
   - Subject-wise Bar Chart (for fewer than 3 subjects)

3. **Assessment History**
   - List of all assessments with dates
   - Subject-wise marks breakdown per assessment
   - Visual percentage indicators

---

## Technical Implementation

### Phase 1: Database Function for Token-Based Marks Access

A new database function is needed to securely fetch student marks using the access token (same security model as fees).

**New SQL Function: `get_student_marks_by_access_token`**

| Input | Output |
|-------|--------|
| `_access_token` (UUID) | Student marks with assessment and subject details |

This ensures marks data is only accessible via the unique parent link, not through direct table queries.

### Phase 2: Hook for Parent Progress Data

**New File: `src/hooks/useParentProgress.ts`**

| Function | Purpose |
|----------|---------|
| `useParentProgress(token)` | Fetches marks, calculates averages, prepares chart data |

Returns:
- `assessmentList`: Grouped marks by assessment with averages
- `subjectBreakdown`: Subject-wise performance with trends
- `summary`: Overall average, trend, status
- `chartData`: Pre-formatted data for PerformanceTrendChart and SubjectRadarChart

### Phase 3: Parent Progress Tab Component

**New File: `src/components/parent/ParentProgressTab.tsx`**

A self-contained component that:
- Displays performance summary cards
- Shows PerformanceTrendChart and SubjectRadarChart (reusing existing chart components)
- Lists assessment history with expandable details
- Handles empty states gracefully

### Phase 4: Refactor ParentView with Tabs

**Modified File: `src/pages/parent/ParentView.tsx`**

Changes:
- Add `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` wrapper
- Move existing fee content into "Fees" tab
- Add new "Progress" tab with `ParentProgressTab` component
- Update header to be shared across tabs

---

## Data Flow

```text
Parent opens /view/:token
         │
         ▼
┌─────────────────────────────┐
│    Shared Header            │
│  (School + Student Info)    │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Tabs: [Fees] [Progress]   │
└─────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌─────────────────────────────┐
│ Fees  │ │ Progress                    │
│ Tab   │ │ - Uses useParentProgress()  │
│(exist)│ │ - Calls RPC function        │
│       │ │ - Renders charts + history  │
└───────┘ └─────────────────────────────┘
```

---

## UI/UX Design

### Tab Placement
- Tabs appear below the student info header, above the summary cards
- Clean, minimal tab design consistent with existing UI

### Progress Tab Layout
1. **Summary Row** (4 cards grid on desktop, 2x2 on mobile)
   - Overall Average (percentage)
   - Assessments Count
   - Trend (arrow + percentage change)
   - Best Subject

2. **Charts Section** (side-by-side on desktop, stacked on mobile)
   - Performance Trend (line chart)
   - Subject Strengths (radar or bar chart)

3. **Assessment History** (expandable cards)
   - Assessment name + date + type
   - Overall score for that assessment
   - Expand to see subject-wise breakdown

### Empty States
- "No marks recorded yet" with friendly message if no data exists
- Charts gracefully show "No data" states (already built into chart components)

---

## File Changes Summary

### New Files (3)

| File | Purpose |
|------|---------|
| `src/hooks/useParentProgress.ts` | Hook to fetch and process marks for parent view |
| `src/components/parent/ParentProgressTab.tsx` | Progress tab UI component |
| (Migration) | SQL function for token-based marks access |

### Modified Files (1)

| File | Changes |
|------|---------|
| `src/pages/parent/ParentView.tsx` | Add tab structure, integrate progress tab |

---

## Security Considerations

- **Token-based access only**: Marks are fetched via RPC function that validates access token
- **No authentication required**: Same security model as fees - unique link provides access
- **Read-only**: Parents can only view data, not modify
- **School isolation**: RPC function ensures only the specific student's data is returned

---

## Technical Details

### Database Migration

```sql
-- Function to get student marks by access token (secure, no direct table access)
CREATE OR REPLACE FUNCTION public.get_student_marks_by_access_token(_access_token uuid)
RETURNS TABLE (
  id uuid,
  student_id uuid,
  marks_obtained numeric,
  max_marks numeric,
  remarks text,
  assessment_id uuid,
  assessment_name text,
  assessment_type text,
  assessment_date date,
  subject_id uuid,
  subject_name text,
  subject_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.student_id,
    sm.marks_obtained,
    sm.max_marks,
    sm.remarks,
    a.id as assessment_id,
    a.name as assessment_name,
    a.assessment_type,
    a.assessment_date,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code
  FROM student_marks sm
  INNER JOIN students st ON st.id = sm.student_id
  INNER JOIN assessments a ON a.id = sm.assessment_id
  INNER JOIN subjects s ON s.id = sm.subject_id
  WHERE st.access_token = _access_token
  ORDER BY a.assessment_date DESC NULLS LAST, s.display_order ASC;
END;
$$;
```

### Hook Structure

```typescript
// useParentProgress.ts returns:
{
  isLoading: boolean;
  error: Error | null;
  data: {
    assessments: AssessmentResult[];      // For history list
    subjectBreakdown: SubjectStats[];     // For charts
    trendChartData: TrendDataPoint[];     // For PerformanceTrendChart
    radarChartData: RadarDataPoint[];     // For SubjectRadarChart
    summary: {
      overallAverage: number;
      assessmentCount: number;
      trend: number;
      status: 'improving' | 'stable' | 'declining' | 'new';
      bestSubject: string | null;
      weakestSubject: string | null;
    };
  };
}
```

---

## Reused Components

Leveraging existing progress module components:
- `PerformanceTrendChart` - Already styled and responsive
- `SubjectRadarChart` - Already handles < 3 subjects gracefully
- `SubjectComparisonChart` - Fallback for fewer subjects
- `ProgressIndicator` - Status visualization

---

## No Changes To

- Fee transparency functionality (completely preserved)
- Existing parent link security model
- Teacher/Admin progress views
- AI analysis features (not exposed to parents)
- Database schema (only adding a function)

