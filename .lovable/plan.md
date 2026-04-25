
# Visual Report Card Template Builder — MVP

A drag-and-drop canvas where each school designs its own branded Report Card, saves it as JSON, previews it filled with real student data, and exports to PDF in the browser. Other document types (fee receipts, TC, ID cards, etc.) follow the same engine in later iterations.

## What the user gets

1. **New page** under Progress → "Report Card Templates" (`/progress/report-card-templates`) with a list of saved templates and a "New Template" button.
2. **Canvas editor** at `/progress/report-card-templates/:id`:
   - Left rail: draggable **field chips** (Student, Academic, School, Signature, plus a "Marks Table" block and basic shapes: Text, Image, Line, Box).
   - Center: A4 canvas (794×1123px @ 96dpi) with a grid background.
   - Right rail: properties panel for the selected element (position, size, font, weight, color, alignment, border).
   - Top bar: template name, paper size (A4/A5), orientation (P/L), margins, Save, Preview, Export PDF, Set as Default.
3. **Drag, drop, resize, delete** elements freely (absolute-positioned). Snap-to-grid (8px) and snap-to-edges of other elements.
4. **Field chips** render as `{placeholder}` in edit mode, and are replaced with real values in preview/export.
5. **Marks table** is a special block that auto-expands to all subjects/terms for the selected student.
6. **Preview mode**: pick a real student + assessment → canvas fills with that student's data.
7. **Export PDF**: client-side via `html2canvas` + `jspdf` at A4 size. Single-student or bulk (loop students in the class, zip not needed for MVP — generates a multi-page PDF).
8. **Set as Default** marks one template per school as the active one used by the existing Report Card flow (`ReportCardView` becomes a renderer that respects the saved template if one exists).

## Technical design

### New table: `document_templates`
```text
id              uuid pk
school_id       uuid (RLS via get_user_school_ids)
doc_type        text  ('report_card' for MVP; future: fee_receipt, tc, id_card…)
name            text
is_default      boolean
paper_size      text  ('A4'|'A5'|'Letter')
orientation     text  ('portrait'|'landscape')
margins         jsonb {top,right,bottom,left} mm
elements        jsonb  array of element nodes (see schema below)
created_by      uuid
created_at, updated_at
```
RLS: school admins manage their school's templates; teachers can read.
A partial unique index ensures only one `is_default=true` per (school_id, doc_type).

### Element JSON schema (stored in `elements`)
```text
{
  id: string,
  type: 'text' | 'field' | 'image' | 'line' | 'box' | 'marks_table' | 'signature_line',
  x: number, y: number, w: number, h: number,    // px on A4 canvas
  rotation?: number,
  // type-specific:
  text?: string,                                 // for 'text'
  field?: '{student_name}' | ...,                // for 'field'
  src?: string,                                  // for 'image' (school logo etc.)
  style?: { fontSize, fontWeight, fontFamily, color, align, bgColor, borderColor, borderWidth, borderRadius, padding },
  tableConfig?: { showGrade, showPercentage, showRank, termColumns: 'all'|'selected', termIds?: string[] },
  signatureLabel?: 'Principal' | 'Class Teacher' | 'Parent/Guardian' | 'Examiner'
}
```

### Field resolver
A pure function `resolveField(token, ctx) → string | ReactNode` where `ctx = { student, school, academicYear, marks, attendance }`. Reuses data already loaded by `useReportCard`. The marks_table element gets a dedicated React renderer that pulls from `ctx.marks` and respects `tableConfig`.

### Components / files to add
```text
src/pages/progress/ReportCardTemplates.tsx          (list page)
src/pages/progress/ReportCardTemplateEditor.tsx     (editor page)
src/components/templates/Canvas.tsx                 (A4 surface, dnd-kit DndContext)
src/components/templates/CanvasElement.tsx          (renders + selects + resizes one element)
src/components/templates/FieldChipsRail.tsx         (left rail draggables)
src/components/templates/PropertiesPanel.tsx        (right rail editor for selected node)
src/components/templates/TemplateToolbar.tsx        (top bar: name, paper, save, preview, export)
src/components/templates/TemplateRenderer.tsx       (read-only render: used in preview + ReportCardView fallback)
src/components/templates/MarksTableElement.tsx
src/lib/templates/field-registry.ts                 (single source of truth for field tags + labels + groups)
src/lib/templates/resolve-fields.ts                 (token → value)
src/lib/templates/pdf-export.ts                     (html2canvas + jspdf)
src/lib/templates/default-report-card.ts            (seed JSON used when "New Template" is created)
src/hooks/templates/useDocumentTemplates.ts         (list/create/update/delete/setDefault)
src/integrations/supabase/types.ts                  (auto-regenerated)
supabase/migrations/<ts>_document_templates.sql
```

### Drag & drop (dnd-kit)
- Field chips are `useDraggable` with `data: { kind: 'field', field: '{student_name}' }`.
- Canvas is one big `useDroppable`; on drop, compute pointer position relative to canvas and append a new element.
- Inside the canvas, each `CanvasElement` is itself draggable for repositioning (custom pointer-based handler — not dnd-kit — to also support resize handles and avoid awkward dnd-kit nested DnD).
- Selection model: clicking an element selects it; properties panel binds to selected node id.
- Snap-to-grid (8px) on move/resize. Arrow keys nudge by 1px (10px with shift).

### PDF export (browser-side)
- `html2canvas` on the canvas DOM at scale 2 → PNG → embed into `jsPDF` A4 page.
- Bulk: iterate over students, re-render the renderer for each, append a new page per student. Show a progress toast.
- Acceptable quality for MVP; Puppeteer/300dpi can come later.

### Integration with existing report card
- `useReportCard` already fetches everything we need. The renderer reuses that data.
- On the existing `ReportCards` page, if a default template exists for the school, switch the rendered output from `ReportCardView` to `<TemplateRenderer template={defaultTemplate} data={reportData} />`. If none, keep current behavior — zero regression.

### Field library (MVP subset)
Student: name, roll_number, class_section, dob, admission_number, parent_name, parent_phone, student_photo
Academic: marks_table, total_marks, max_marks_total, percentage, grade, rank, attendance_percentage, days_present, days_absent, teacher_remarks, principal_remarks
School: school_name, school_logo, school_address, school_phone, academic_year, term_name, exam_name, print_date
Signatures: principal_signature_line, class_teacher_signature_line, parent_signature_line

## Out of scope (future phases)
- Other document types (fee receipt, TC, ID card 8-up, fee book, bonafide, merit cert)
- AI layout detection from uploaded sample
- Server-side Puppeteer / 300dpi
- WhatsApp send of generated PDF
- Template versioning, locking, marketplace/sharing across schools

## Acceptance criteria
1. Admin can create, name, save, and reload a Report Card template; canvas state is identical after refresh.
2. Field chips drop onto canvas as resolvable placeholders; preview with a real student fills them with correct values.
3. Marks table block auto-renders all subjects + terms for the selected student.
4. PDF export downloads a single-page A4 PDF that visually matches the canvas.
5. Bulk export generates one multi-page PDF for an entire class within ~60s.
6. Setting a template as default makes the existing Report Card page render via the new template; deleting/unsetting falls back to the current view.
7. RLS: a school cannot see/edit another school's templates.
