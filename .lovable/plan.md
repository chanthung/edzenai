
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
