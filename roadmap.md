# Roadmap

- [x] Replace all SchoolFees and EduTrack branding with EdZen AI across user-facing source files (no legacy instances found)
- [x] Verify no legacy brand strings remain
- [x] Audit the current database schema read-only for timetable-relevant entities and report findings
- [x] Revise timetable design for multi-tenant isolation (v3)
- [x] Add dedicated least-privilege timetable service DB role + teacher availability privacy to the design
- [ ] Replace broad service-role RLS with transaction-scoped verified tenant context (3-layer model)
