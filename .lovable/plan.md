

# Plan: Update Existing PDF Manual with New User & Subject Assignment Guide

## What Changed Since the Manual Was Written

1. **"Teachers" renamed to "Users"** — now supports Teacher and Accountant roles
2. **Class assignment removed from teacher edit** — teacher access to classes is now derived from their assigned subjects' class mappings
3. **New flow**: Create Subject → Assign Classes to Subject → Assign Subject to Teacher → Teacher automatically gets access to those classes

## Changes to the PDF Manual

### Section 4: Rename "Teachers" → "Users"

**4.1 Add a User (Teacher or Accountant)**
- Updated steps: Select Role (Teacher / Accountant) first
- For Teachers: assign Subjects (classes are derived automatically)
- For Accountants: no subject/class assignment needed
- Updated field table with Role field

**4.2 Assign Subjects to a Teacher**
- Step-by-step for editing a teacher and checking/unchecking subjects
- Explain that class access is automatically derived from subject-class mappings
- Remove all references to manual "Assign Classes" checkboxes

**4.3 NEW: How Subject-Class Mapping Works**
- Explain the relationship: Subject → assigned Classes → Teacher sees those classes
- Example: Teacher George assigned EVS → EVS mapped to Class 2, 3, 6 → George sees Class 2, 3, 6 in dashboard
- Reference to Section 6.2 (Subjects) for creating subjects and assigning classes

**4.4 About User Roles**
- Teacher: Access Student Progress module only (subjects, assessments, marks, attendance)
- Accountant: Access fee management, student list, payments
- Owner/Admin: Full access including settings and user management

### Section 6.2: Update Subjects Section
- Add note that assigning classes to a subject determines which teachers can see those classes
- Cross-reference back to Section 4

## Technical Approach

1. Use the same Python ReportLab script pattern as the original manual
2. Regenerate the full PDF with all existing content preserved and Section 4 updated
3. Add the new sections seamlessly
4. Version the output as `EdZen_AI_User_Manual_v2.pdf`
5. QA: Convert to images and inspect every page

## Estimated Output
- ~14-15 pages (was 13)
- Same styling and formatting as existing manual

