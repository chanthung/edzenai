

## Plan: Auto-Create Assessments from Template Terms (Option A)

### Problem
The Assessments page has manual creation with Type/Domain/Category dropdowns, but the Marks Entry page only shows manually-created assessments (e.g., "End Term Feb", "Mid Term"). Template terms (e.g., "1st Assessment", "2nd Assessment", "3rd Assessment") defined in the template are not reflected as selectable assessments.

### Recommended Approach: Option A — Auto-create assessments from template terms

This is the best fit because:
- The `assessments` table already has the right fields (type, domain, category, class_name)
- Marks Entry already queries `assessments` — no changes needed there
- Template terms become real assessments, so everything stays consistent
- Users can still manually create additional assessments if needed

### Implementation Steps

1. **Auto-create on template assignment**
   - In `ClassAssignment.tsx`, after a template is successfully assigned to a class, fetch that template's `template_terms`
   - For each term, insert an `assessment` record with:
     - `name` = term name (e.g., "1st Assessment")
     - `assessment_type` = "term_exam" (new type)
     - `class_name` = the assigned class
     - `academic_year_id` = current year
     - `assessment_domain` = "cognitive" (default)
     - `assessment_category` = "summative" (default)
   - Skip creation if an assessment with the same name + class + year already exists (avoid duplicates)

2. **Add "Term Exam" to assessment types**
   - Add `{ value: "term_exam", label: "Term Exam" }` to the `ASSESSMENT_TYPES` array in `Assessments.tsx` so manually-created term exams are also possible

3. **Visual indicator on auto-created assessments**
   - No schema change needed — auto-created assessments are regular assessments and can be edited/deleted like any other

### Files to modify
- `src/components/admin/templates/ClassAssignment.tsx` — add post-assignment logic to create assessments from terms
- `src/pages/progress/Assessments.tsx` — add "Term Exam" type to dropdown

### What stays unchanged
- `MarksEntry.tsx` — already queries assessments filtered by class, so template-derived assessments will appear automatically
- Database schema — no migrations needed
- Existing manually-created assessments remain untouched

