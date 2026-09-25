# Finish the year link on teacher subject assignments

Only teacher subject assignments change. Promotion, enrollments, marks, attendance, fees, the timetable and past academic years are not touched.

## Checked before writing this plan
- 21 assignments in total: 6 from Freen School already have a year, and 15 from Cherry School have no year.
- All 15 assignments without a year belong to Cherry School.
- Cherry School's current year is 2026-2027 (15 Jan 2026 – 15 Mar 2027). Its other two years are switched off.
- The current "no duplicates" rule covers teacher, subject, class and year, but it does not include the school.

## Steps
1. **Fill in the year:** give the 15 Cherry School assignments the 2026-2027 year. The update only touches rows from that school that have no year, and it changes nothing except the year.
2. **Check the result:**
   - 21 in total, all with a year, none empty.
   - Each assignment's year belongs to its own school.
   - No duplicates of teacher, subject, class and year.
   - Every teacher and subject is valid.
3. **Make the year required:** only if step 2 passes, and only for the year. No other field changes.
4. **Update the no-duplicates rule:** replace it with one on teacher, subject, school, class and year. The same assignment can still appear once in each year.
5. **Check the screens and the invite function:** re-read Edit Teacher, the teacher's subject and class lists, and the invite-acceptance function. They should read and save only current-year assignments and never delete or change other years. No code changes are expected. The invite function already skips subject assignments when the current year is unclear, so the required year won't break it.
6. **Report back:** rows before, rows filled in, rows still empty, rows after, whether the year is now required, the new duplicates rule, files changed, database changes, access rule changes (none), and confirmation that existing data was kept.

## Technical details
- Data update, run on its own:
  `UPDATE teacher_subject_assignments SET academic_year_id = 'a9f6474c-…' WHERE academic_year_id IS NULL AND school_id = '508cf113-…'`
- Database change, one migration:
  - `ALTER COLUMN academic_year_id SET NOT NULL`
  - Create a new unique index on `(teacher_id, subject_id, school_id, class_name, academic_year_id)`
  - Drop the old unique index `tsa_teacher_subject_class_year_uidx`
- No access rules change.
