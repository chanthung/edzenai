

# AI-Powered Student Progress Analysis with Interactive Charts

This plan enhances the Student Progress module with intelligent AI analysis and professional data visualizations to help teachers make better-informed decisions about student performance.

---

## What You'll Get

### 1. Interactive Performance Charts
Visual representations of student data using the already-installed Recharts library:
- **Line Charts**: Track individual student progress over time across assessments
- **Bar Charts**: Compare subject-wise performance within a class
- **Area Charts**: Visualize class-wide trends and distributions
- **Radar Charts**: Show balanced scorecard view of subject strengths/weaknesses

### 2. AI-Powered Insights
Using Lovable AI (no API key needed), the system will:
- Automatically generate personalized improvement recommendations for at-risk students
- Identify subject-specific learning gaps based on performance patterns
- Create actionable teaching focus areas for teachers
- Generate parent-friendly progress summaries for PTM meetings

### 3. Enhanced Analytics Dashboard
- Class performance distribution visualization
- Subject difficulty analysis (which subjects are hardest for the class)
- Comparative assessment analysis (how did this test compare to previous ones)
- Print-ready progress reports with charts

---

## Technical Implementation

### Phase 1: Performance Visualization Components

**New Files:**

| File | Purpose |
|------|---------|
| `src/components/progress/charts/PerformanceTrendChart.tsx` | Line chart showing student progress over time |
| `src/components/progress/charts/SubjectComparisonChart.tsx` | Bar chart comparing subject scores |
| `src/components/progress/charts/ClassDistributionChart.tsx` | Area chart showing class score distribution |
| `src/components/progress/charts/SubjectRadarChart.tsx` | Radar chart for multi-subject analysis |
| `src/components/progress/charts/AssessmentTrendChart.tsx` | Line chart comparing multiple assessments |

### Phase 2: AI Analysis Edge Function

**New Edge Function: `analyze-progress`**

This function uses Lovable AI (google/gemini-3-flash-preview) to:
- Accept student marks data and generate insights
- Return structured recommendations for improvement
- Identify specific learning gaps
- Generate PTM-ready summaries

```text
Request Flow:
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Frontend       │────>│ analyze-progress    │────>│ Lovable AI       │
│  Progress Page  │     │ Edge Function       │     │ Gateway          │
└─────────────────┘     └─────────────────────┘     └──────────────────┘
                                │
                                ▼
                        ┌───────────────────┐
                        │ Structured        │
                        │ AI Insights JSON  │
                        └───────────────────┘
```

### Phase 3: Enhanced Dashboard & Student Progress Pages

**Modified Files:**

| File | Changes |
|------|---------|
| `src/pages/progress/ProgressDashboard.tsx` | Add class-wide charts, AI summary panel |
| `src/pages/progress/StudentProgress.tsx` | Add individual performance charts, AI recommendations |

**New Hook:**

| File | Purpose |
|------|---------|
| `src/hooks/progress/useAIAnalysis.ts` | Call AI edge function and cache results |

### Phase 4: AI Insights UI Components

**New Components:**

| File | Purpose |
|------|---------|
| `src/components/progress/AIInsightsPanel.tsx` | Display AI-generated recommendations |
| `src/components/progress/LearningGapsCard.tsx` | Show identified subject-wise gaps |
| `src/components/progress/PTMSummaryCard.tsx` | Parent-ready summary generator |

---

## Detailed Feature Breakdown

### A. Student Progress Page Enhancements

**Performance Over Time Chart**
- X-axis: Assessment names/dates
- Y-axis: Percentage score
- Shows trend line with colored regions (green = improving, red = declining)

**Subject Strength Radar**
- Each axis = one subject
- Shows current average vs. class average
- Highlights weak subjects visually

**AI Analysis Panel**
- "What's Working" section with positive patterns
- "Focus Areas" with specific improvement suggestions
- "Recommended Actions" for teachers

### B. Class Dashboard Enhancements

**Class Distribution Chart**
- Shows how many students fall into each grade band (0-40%, 40-60%, 60-80%, 80-100%)
- Visual comparison across assessments

**Subject Difficulty Chart**
- Bar chart showing class average per subject
- Identifies which subjects need more attention

**AI Class Summary**
- Top 3 performing students
- Students needing immediate attention
- Suggested class-wide focus areas

### C. AI Insights Details

The AI will analyze:
1. Performance trends (improving, stable, declining)
2. Subject-wise strengths and weaknesses
3. Comparison with class average
4. Gap between potential and performance
5. Specific actionable recommendations

Sample AI output structure:
```text
{
  "summary": "Brief 2-line summary of student performance",
  "strengths": ["Subject areas performing well"],
  "improvements": ["Specific areas needing work"],
  "recommendations": ["Actionable teacher/parent steps"],
  "riskLevel": "low" | "medium" | "high",
  "focusSubject": "The most critical subject to focus on"
}
```

---

## File Changes Summary

### New Files (11 total)

| Category | Files |
|----------|-------|
| Charts (5) | `PerformanceTrendChart.tsx`, `SubjectComparisonChart.tsx`, `ClassDistributionChart.tsx`, `SubjectRadarChart.tsx`, `AssessmentTrendChart.tsx` |
| Components (3) | `AIInsightsPanel.tsx`, `LearningGapsCard.tsx`, `PTMSummaryCard.tsx` |
| Hooks (1) | `useAIAnalysis.ts` |
| Edge Function (1) | `supabase/functions/analyze-progress/index.ts` |
| Config (1) | Update `supabase/config.toml` to include new function |

### Modified Files (2)

| File | Changes |
|------|---------|
| `src/pages/progress/ProgressDashboard.tsx` | Add chart sections and AI summary |
| `src/pages/progress/StudentProgress.tsx` | Add individual charts and AI panel |

---

## User Experience Flow

### Teacher Views Dashboard
1. Sees class-wide performance distribution chart
2. Identifies which subjects are hardest
3. Clicks "Get AI Analysis" for class insights
4. Gets prioritized list of at-risk students

### Teacher Views Individual Student
1. Sees performance trend line across assessments
2. Sees radar chart of subject strengths
3. Clicks "Get AI Recommendations"
4. Gets specific, actionable improvement steps
5. Can generate PTM summary for parents

### Generating PTM Reports
1. Teacher selects students for PTM
2. Clicks "Generate PTM Summaries"
3. Gets print-ready cards with:
   - Performance charts
   - AI-generated parent-friendly summary
   - Specific improvement suggestions

---

## Security Considerations

- AI edge function will verify teacher/admin authentication
- Student data is processed but not stored by AI
- All AI calls go through Lovable AI gateway (no external API keys needed)
- RLS policies ensure teachers only see their school's data

---

## No Changes To

- Fee transparency module (completely isolated)
- Existing database tables
- Authentication flow
- Parent view (future enhancement)

