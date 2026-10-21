# Timetable Automation — Phase A: Read-only Audit

Your brief asks for six phases. This plan covers only **Phase A**, a read-only audit. Nothing in the app, database, functions or live data changes. Phases B–F each get their own plan after you review the audit.

## What the audit checks

1. **Screens:** Settings → Timetable (all seven setup sections plus View), and the Dashboard Timetable tab.
2. **Database:** the nine timetable tables, how they link, their security rules, and how `create_timetable_run()` saves runs and entries. This includes whether draft, published, lock, publisher and timestamp fields exist.
3. **API:** `timetable-api` GET and POST. Which inputs the generator receives and which results it can save back, such as unplaced lessons and diagnostics.
4. **Teachers:** the import columns and the year-scoped teaching assignments, to see what supporting `subjects_taught` and `classes_taught` would take.
5. **Run history:** Cherry School's saved runs and entries, read only.
6. **Tests:** the timetable tests that exist today.

## Limitation: the Python generator

`generate_timetable.py`, the adapter and the API reader are on your own computer (`C:\D Drive\...`), so I can't open them. The audit covers only what the API sends and accepts. To check the solver's constraints (workload limits, locks, unplaced list), upload those three files and I'll add them to the audit.

## What you get

A report in Files called `EdZenAI-Timetable-Automation-Audit.md`. For each requirement in sections 4–9 of your brief, it gives:
- **Status:** Implemented, Partial or Missing, with evidence.
- **Smallest safe change**, for example new screens only versus a database addition such as publish fields, lesson locks or a diagnostics column.
- **Risks** to live schools.

It ends with a proposed order and scope for Phases B–F, including any database changes that need your approval first.

## Technical details
- Only reads: file reads, SELECT queries, schema and security-rule inspection. No migrations, deployments or publishing.
- Cherry data is only read. Nothing is created or deleted.
