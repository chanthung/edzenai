

## Plan: EdZen AI Explainer — Full-Length Training Video Series

### Scope change

Each of the 6 major sections becomes its own 3-4 minute video (total ~20-24 minutes). Due to sandbox render limits (600s timeout), we render each section as a separate MP4, then concatenate into a final full video with ffmpeg.

### Output

6 individual chapter videos + 1 combined full video, all at `/mnt/documents/`:

| # | File | Duration | Content |
|---|------|----------|---------|
| 1 | `ch1-students.mp4` | ~3.5 min | 1.1 Add Manually, 1.2 Excel Import (AI), 1.3 Managing Students |
| 2 | `ch2-academic-years.mp4` | ~3 min | 2.1 Create Academic Year, 2.2 Promotions |
| 3 | `ch3-fee-setup.mp4` | ~3.5 min | 3.1 Fee Categories, 3.2 Fee Structures, 3.3 Installments, 3.4 Class Assignment |
| 4 | `ch4-teachers.mp4` | ~3 min | 4.1 Add Teacher, 4.2 Assign Subjects & Classes |
| 5 | `ch5-settings.mp4` | ~3 min | 5.1 School Profile, 5.2 Payment QR, 5.3 Password, 5.4 Assessment Templates |
| 6 | `ch6-progress.mp4` | ~4 min | 6.1 Dashboard, 6.2 Subjects, 6.3 Assessments, 6.4 Marks Entry, 6.5 Attendance, 6.6 Report Cards |
| — | `edzen-full-training.mp4` | ~20 min | All chapters concatenated with title cards between |

### Visual approach

- **Screen-recorded style**: Simulated UI mockups (not actual screenshots) built with styled divs matching EdZen's Indigo/Purple design system
- **Animated pointer cursor** simulating clicks on buttons, menu items, form fields
- **Step-by-step captions** at the bottom third explaining each action
- **Chapter title cards** between sections with section name + brief description
- **Consistent persistent elements**: subtle gradient background, EdZen branding watermark

### Per-chapter structure

Each chapter follows this pattern:
1. **Chapter title card** (3-4s) — section name + icon
2. **Subsection segments** — each subsection gets 45-90s with:
   - Simulated sidebar/nav highlighting the current page
   - Mockup UI appearing (forms, tables, cards)
   - Animated cursor clicking through the workflow step-by-step
   - Bottom caption text explaining what's happening
3. **Chapter summary** (2-3s) — quick recap card

### Technical approach

1. **Remotion project** under `remotion/` with shared components (MockSidebar, MockTable, MockForm, AnimatedPointer, StepCaption, ChapterTitle)
2. **6 separate compositions** — one per chapter, each registered in Root.tsx
3. **Render each chapter individually** via the programmatic render script (stays within 600s timeout per render)
4. **Concatenate** all chapters using ffmpeg into the final combined video
5. **No changes** to the existing application codebase

### File structure

```text
remotion/
  src/
    index.ts
    Root.tsx
    components/
      MockSidebar.tsx
      MockCard.tsx
      MockTable.tsx
      MockForm.tsx
      AnimatedPointer.tsx
      StepCaption.tsx
      ChapterTitle.tsx
      Background.tsx
    chapters/
      Ch1Students.tsx
      Ch2AcademicYears.tsx
      Ch3FeeSetup.tsx
      Ch4Teachers.tsx
      Ch5Settings.tsx
      Ch6Progress.tsx
  scripts/
    render-chapter.mjs    (renders one chapter by composition ID)
    render-all.sh         (loops all 6 + concatenates)
  public/
```

### Rendering strategy

Each chapter renders separately to stay within the 600s timeout:
```bash
node scripts/render-chapter.mjs ch1-students /mnt/documents/ch1-students.mp4
node scripts/render-chapter.mjs ch2-academic-years /mnt/documents/ch2-academic-years.mp4
# ... etc
ffmpeg -f concat -i chapters.txt -c copy /mnt/documents/edzen-full-training.mp4
```

