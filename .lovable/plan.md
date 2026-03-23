
# Auto-Assign Student Fees — IMPLEMENTED

## What Was Built

1. **`fee_structure_classes` table** — links fee structures to classes with `auto_assign` toggle
2. **`auto_assign_fees_for_student` RPC** — DB function that auto-inserts student_fees based on class
3. **`student_fees` unique constraint** — prevents duplicate fee assignments
4. **Fee Setup UI** — each fee structure card now has "Apply to Classes" section with class checkboxes and auto-assign toggle
5. **Student creation** — auto-assigns fees after enrollment (manual + bulk import)
6. **Student Fee Manager** — shows info banner when fees were auto-assigned; still works as override UI

## Flow

1. Admin → Fee Setup → select classes for each fee → enable auto-assign
2. New student created/imported → fees auto-applied based on class
3. Manual override still available via student fee manager

---

# Category Groups & New-Admission-Only Logic — IMPLEMENTED

## What Was Added

1. **`category_group` field on `fee_categories`** — text field to group related items (e.g., "Uniforms")
2. **`new_admission_only` field on `fee_structure_classes`** — boolean to skip auto-assign for continuing students
3. **Updated `auto_assign_fees_for_student` RPC** — checks enrollment history; skips new_admission_only fees for existing students
4. **Fee Setup UI** — "Group" input in category dialog; group headers in categories list; "New admissions only" toggle under auto-assign
5. **Student Fee Manager** — fees grouped by category_group with section headers; "Optional for continuing" badge on new-admission-only fees

## Flow

1. Admin creates categories with group name (e.g., Trousers, Jacket → group "Uniforms")
2. Creates fee structures, assigns to classes with auto-assign + new admissions only enabled
3. New student → all uniform items auto-assigned (compulsory)
4. Existing student promoted → uniform items NOT auto-assigned; admin manually picks what's needed
