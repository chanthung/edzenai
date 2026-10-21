# Roadmap

- [ ] Stage 2 explicit existing HR-only teacher linking through Add User; blocked on approval of additive invitation target storage and atomic link migration. Preserve IDs, HR, assignments and timetables; verify invitation acceptance only after implementation.

- [x] Context-sensitive help UX: shared FieldHelp/FieldHint/SystemGenerated component applied to Edit Teacher, HR fields, teacher import, Teaching Assignments matrix and timetable Subject Requirements/Teacher Availability. Live-verified popovers in scrollable dialog and at 375px; 71 tests and build passed. No behavior/schema changes.
- [x] Add compatible blank teacher template and saved, school-scoped teacher Excel export. Both signed-in downloads verified (18 saved Cherry teachers), blank workbook rejected as empty, optional fields/parser and mixed-school guards tested; 67 tests and automatic build passed. No live import save or Excel desktop check performed; no record changes.

- [x] Simplify teacher imports: flexible headers/manual mapping, permissive optional HR fields and unmatched emails, independent row safety/results, frozen post-save preview, Add User compatibility. Live mixed workbook saved 4 HR-only records, skipped 3, retained all existing rows/assignments/timetable/invitations, rejected cross-school request; test records cleaned up. 57 tests and automatic build passed. Live invitation acceptance not exercised.
- [x] Stage 3 teacher import: optional email + HR-only teacher records. Pre-approval security audit passed (RLS/auth/uniqueness/triggers/FKs all NULL-safe); user approved; migration applied. Live verified: HR-only create (EMP-0004 auto-assigned), email update, invitation-required, invalid/duplicate blocking, Not invited badge, Edit Teacher guards, assignments/timetable untouched, cleanup done; 54 tests + build OK.
- [x] Correct confirmed Cherry paid renewal through 29 Dec 2027; distinguish invoice/access dates, align explicit renewal lifecycle saves and Global Admin badges with authoritative state. Controlled import and retry HTTP 200, Edit Teacher read-back without reload, restored original HR, unchanged assignments/timetable, cross-school HTTP 403; 44 tests and build OK.
- [x] Rechecked current Cherry authorization with a real controlled Excel request and retry on 21 Oct 2026: membership valid, access block false, import HTTP 403 because authoritative restriction remains true; 41 teacher tests passed and automatic build OK.
- [x] Complete successful Cherry Excel save, retry and Edit Teacher read-back after user-confirmed legitimate renewal correction; no enforcement bypass.

- [x] Fix Stage 2 visibility reporting: traced upload-to-list, added accurate row-level saved/blocked/failed results and explicit invitation guidance without bypassing restrictions.
- [x] Verified invalid/unmatched rows, controlled restricted HR update and unauthorized school write with no data changes; 41 tests passed and automatic build/typecheck OK.

- [x] Stage 2 Phase A: inspect approved workbook, teacher schema, account/invitation paths, ID triggers, RLS and Excel dependency; existing teacher HR tests passed (9/9).
- [x] Stage 2 existing-teachers-only import: template download, editable validated preview, explicit confirmation and school-authorized HR updates; no accounts or invitations.
- [x] Verify teacher import validation, cancellation, downloadable errors and unauthorized tenant rejection; 36 relevant tests passed and automatic type-check/build OK. Rejected/cancelled imports left teacher fields and assignment rows unchanged.
- [x] Verify successful import persistence and Edit Teacher read-back; confirmed renewal resolved the demonstrated restriction.

- [x] Verify Stage 1 teacher HR forms, persistence, validation, stable IDs, assignments and school isolation; fix only related defects and run tests. New invite acceptance was not exercised; automatic ID generation was checked through live trigger definitions and existing records.

- [x] Replace all SchoolFees and EduTrack branding with EdZen AI across user-facing source files (no legacy instances found)
- [x] Verify no legacy brand strings remain
- [x] Audit the current database schema read-only for timetable-relevant entities and report findings
- [x] Revise timetable design for multi-tenant isolation (v3)
- [x] Add dedicated least-privilege timetable service DB role + teacher availability privacy to the design
- [x] Replace broad service-role RLS with transaction-scoped verified tenant context (3-layer model)
- [x] Implement the nine timetable_* tables, tenant triggers, composite FKs, RLS, least-privilege timetable_service role and tenant-context functions

- [x] Teacher account-linking UX Stage 1: Account column in Users shows Account linked / Invitation pending / Invitation expired / Not invited from persisted state (user_id + unaccepted invites matched by normalized email), with FieldHelp guidance for unlinked records; active switch and employment status unchanged. Live-verified on Cherry (16 Not invited, 3 Account linked, popover OK); 77 tests and build passed. Limitation: email-less HR-only records cannot be matched to invites. Linking workflow (Stage 2) not started.
