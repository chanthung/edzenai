# Roadmap

- [ ] Recheck current Cherry authorization and complete a controlled Excel save, retry and Edit Teacher read-back; preserve all school restrictions and assignments.

- [x] Fix Stage 2 visibility reporting: traced upload-to-list, added accurate row-level saved/blocked/failed results and explicit invitation guidance without bypassing restrictions.
- [x] Verified invalid/unmatched rows, controlled restricted HR update and unauthorized school write with no data changes; 41 tests passed and automatic build/typecheck OK.

- [x] Stage 2 Phase A: inspect approved workbook, teacher schema, account/invitation paths, ID triggers, RLS and Excel dependency; existing teacher HR tests passed (9/9).
- [x] Stage 2 existing-teachers-only import: template download, editable validated preview, explicit confirmation and school-authorized HR updates; no accounts or invitations.
- [x] Verify teacher import validation, cancellation, downloadable errors and unauthorized tenant rejection; 36 relevant tests passed and automatic type-check/build OK. Rejected/cancelled imports left teacher fields and assignment rows unchanged.
- [ ] Verify successful import persistence and Edit Teacher read-back — blocked by Cherry School's server-side write restriction. No school state, subscription or security rules changed to bypass it.

- [x] Verify Stage 1 teacher HR forms, persistence, validation, stable IDs, assignments and school isolation; fix only related defects and run tests. New invite acceptance was not exercised; automatic ID generation was checked through live trigger definitions and existing records.

- [x] Replace all SchoolFees and EduTrack branding with EdZen AI across user-facing source files (no legacy instances found)
- [x] Verify no legacy brand strings remain
- [x] Audit the current database schema read-only for timetable-relevant entities and report findings
- [x] Revise timetable design for multi-tenant isolation (v3)
- [x] Add dedicated least-privilege timetable service DB role + teacher availability privacy to the design
- [x] Replace broad service-role RLS with transaction-scoped verified tenant context (3-layer model)
- [x] Implement the nine timetable_* tables, tenant triggers, composite FKs, RLS, least-privilege timetable_service role and tenant-context functions
