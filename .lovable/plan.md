# Student Promotion System — Audit Report (read-only)

This is a report only. Nothing was changed or deployed. If you approve, no code will be written; approving just marks the audit as reviewed so we can pick improvements next.

Live data right now: 0 promotion runs, 0 outcomes, 0 promotion rules saved, 0 students with two enrollments in the same year.

## 1. Architecture
- One wizard on the **Academic Years → Promotions** tab. All the logic runs in the browser. There is no backend function and no database procedure for promotion.
- There is a second, stronger rule engine (per-board pass marks, grace marks, best-of-N, compartment subjects) plus a Promotion Rules editor. **The live wizard does not use it.**
- There is also an older promotion dialog that nothing opens any more (dead code).

## 2. Database tables involved
- `promotion_runs`: one row per run. Stores the source year, target year, consent checklist and notes. Status is always "completed".
- `promotion_outcomes`: one row per student. Stores from/to class and section, percentage, failing subjects, the suggested result (`auto_status`), the final result (`status`) and an override reason.
- `promotion_rules`: board rules. Saved and edited, but ignored by the wizard.
- `student_enrollments`: the wizard adds new rows here. A database rule allows only one enrollment per student per year.
- `students`: the wizard updates class and section for promoted students.
- Read only: `assessments`, `student_marks`, `class_template_assignments`, `template_grade_mappings`, `academic_years`.
- There are no database triggers on any promotion or enrollment table.

## 3. Backend functions: none
No backend function performs or supports promotion. The help assistant only mentions where the tab is.

## 4. AI components: none
There is no AI in promotion. The "suggestion" is fixed arithmetic in the browser. There are no n8n workflows.

## 5. Workflow states actually found
- On screen: Promote / Retain / Exclude.
- Saved outcome values: `promoted`, `retained`, `excluded`. "Compartment" appears in the report screen but is never saved.
- Run status: always `completed`.
- There is **no** Draft, Submitted, Approved, Rejected or Returned state.

## A. Current flow
```text
Pick source year -> pick target year (any later year) -> pick class
 -> load source-year enrollments + that year's marks + grading scale
 -> each student gets a suggestion:
      any failing subject (grade in fail set, or below 33%) -> Retain
      Class 12 -> Exclude (passed out)
      otherwise, including NO MARKS -> Promote
 -> admin overrides per student
 -> 5-checkbox consent dialog (one person)
 -> saves immediately:
      1. new target-year enrollments (promoted: next class; retained: same class)
      2. students table class/section updated (promoted only, one at a time)
      3. audit run + outcomes (best effort; a failure only logs a warning)
 -> printable result report
```
Fees for the new year are **not** set up automatically.

## B. Year handling
- The run records both years (`from_year_id`, `to_year_id`). There is no enforced link to the Academic Years table.
- The target year only has to start after the source year, so skipping a year is possible.
- The wizard **adds a new enrollment** for the target year. The old enrollment is never changed or deleted.

## C. Draft / approval
There is none. Promotion happens straight away in one step by whoever confirms.

## D. AI
Not applicable. The suggestion is rule-based, stored as `auto_status`, and the admin can always override it. The admin's choice is final.

## E. Execution (example: 2026-27, Class 4-A)
Promote: a new enrollment in 2027-28 for Class 5-A, and the student's main record becomes Class 5-A. The 2026-27 enrollment stays exactly as it was. The new year only appears on the new row.

## F. Section
The section is always copied (4-A becomes 5-A). There is no way to change it during promotion. Any section change has to be done afterwards in Students.

## G. Edge cases
- Promote / Retain: supported.
- Graduate (Class 12): treated as Exclude. No enrollment and **no outcome record**, so graduation is not recorded.
- Transfer / dropout: no option exists. The only choice is Exclude, which leaves no trace.
- Missing marks: **Promote by default** (risky). The unused rule engine would send these to "review" instead.
- Attendance: not used. The attendance threshold in the rules is never checked.
- Fails the criteria: Retain, which the admin can override.
- Several enrollments / no enrollment: only source-year enrollments are listed. A student with no enrollment that year is silently left out.
- Missing target year: the tab is blocked until at least two years exist.
- Duplicate or already promoted: students already enrolled in the target year are hidden. The one-enrollment-per-year rule blocks a second enrollment.

## H. Historical data
Old enrollments, marks, attendance, fees and past promotion records are **not changed**. The only record that is overwritten is the student's current class and section on their main record.

## I. School isolation
- Runs, outcomes and rules can only be read or written by that school's admins.
- Enrollments are limited to students of the admin's own school.
- Security note found during the audit: `student_enrollments` has a public read rule (anyone can read every row). I did not change it.

## 11. Gaps
1. The saved board rules and the attendance threshold are not used by the wizard.
2. Students with no marks are promoted by default.
3. There is no draft or approval step, and no way to split work between principal and admin.
4. The saves are not grouped as one action, so a failure halfway can leave partial changes. The audit log can also fail silently.
5. The audit fields for who ran it and from which IP address stay empty, even though the consent text promises they are logged.
6. There is no graduated, transferred or withdrawn outcome.
7. Section can't be changed during promotion.
8. The target year can skip years.
9. Fees for the new year aren't set up automatically.
10. The old promotion dialog is dead code.
11. There is a public read rule on enrollments.

## 12. Future automation opportunities (not implemented)
- Choose the source year automatically from the current-year setting, and suggest the next year as the target.
- Build the candidate list automatically for all classes at once.
- Use the saved board rules and the attendance threshold for suggestions, and send students with missing data to "review".
- Optional AI explanation for borderline cases, where the admin makes the final choice.
- Draft, then submit, then principal approval, then execute, with batch approval.
- Suggest sections (keep, or balance by size).
- Run the whole promotion as one safe step on the server, recording who ran it and when.
- Set up fees for the new year automatically after promotion.
- Send parents a WhatsApp or email notice (the checkbox exists but only records intent).
- Record graduated, transferred and withdrawn students.

## K. Timetable relationship
They are independent. Promotion never reads or writes timetable data. The timetable only reads enrollments, so it will pick up new-year classes once promotion has run.
