# Timetable Service — Read-Only Database Audit

No schema, data, or policy was changed. All findings come from live read-only queries.

## 1. Table inventory

### schools
- Columns (relevant): `id uuid PK`, `name text`, `address`, `phone`, `email`, `logo_url`, `upi_id`, `qr_code_url`, `created_at/updated_at timestamptz`, subscription fields (`subscription_type/status/start_date/renewal_date`, `trial_start_date/end_date`, `system_state` enum, `payment_verified*`, `subscription_plan`, `custom_per_student_fee`, `discount_percent`, `billing_cycle`, `pending_amount`, `next_billing_date`), `board text`, `default_classes text[]`, `default_sections text[]`, `onboarding_completed bool`, lifecycle/purge fields, `referred_by uuid -> partners.id`, `access_blocked*`.
- PK `id`. FK: `referred_by -> partners.id`. Indexes: `schools_pkey`, `idx_schools_referred_by`.
- school_id: is itself. academic_year_id: no.
- SELECT RLS: platform admins (`is_platform_admin()`), school admins (`id in get_user_school_ids()`), accountants (`get_accountant_school_ids()`), plus **`Public can view school info` = true for `anon`**.
- Sample: `{id: 7655a339…, name: "Fun school", board: null, plan: starter, state: subscription_active}`.

### academic_years
- `id uuid PK`, `school_id uuid NOT NULL -> schools.id`, `name text`, `start_date date`, `end_date date`, `is_active bool default true`, `created_at`, `updated_at`.
- Indexes: `academic_years_pkey`, `idx_academic_years_school_id`. No unique constraint on (school_id, is_active).
- school_id: yes. academic_year_id: is itself.
- SELECT RLS: admins, teachers, accountants — all scoped by school.
- Sample: `2026-2027 (2026-01-15 → 2027-03-15, active)`, `2025-2026 (active)`, `2024-2025 (inactive)`.

### school_teachers
- `id uuid PK`, `user_id uuid`, `school_id uuid -> schools.id`, `name`, `email`, `is_active bool default true`, `created_at`, `updated_at`, `role text default 'teacher'`, `employee_id text`.
- Indexes: `school_teachers_pkey`, unique `(user_id, school_id)`, partial unique `(school_id, lower(employee_id))`.
- school_id: yes. academic_year_id: no (staff are not year-scoped).
- SELECT RLS: school admins for their schools; teachers see only their own row.
- Sample: `{role: accountant, is_active: true}`, `{role: teacher, is_active: true}` — `employee_id` currently null for existing rows.

### subjects
- `id uuid PK`, `school_id uuid -> schools.id`, `name`, `code`, `display_order int`, `created_at`, `subject_type` enum (`academic|co_curricular|vocational`).
- Indexes: `subjects_pkey`, `idx_subjects_school_id`.
- school_id: yes. academic_year_id: no.
- SELECT RLS: admins, teachers, **and `Public can view subjects` = true**.
- Sample: `English/ENG/academic`, `Hindi/HIN`, `Numbers/NUM`.

### subject_class_assignments
- `id uuid PK`, `subject_id -> subjects.id`, `school_id -> schools.id`, `class_name text`, `created_at`.
- Indexes: `pkey`, unique `(subject_id, class_name)` — note: **not** scoped by school in the unique key, but subject already belongs to one school.
- school_id: yes. academic_year_id: **no** — subject/class mapping is not year-scoped.
- SELECT RLS: admins/teachers by school, **plus `Public can view subject class assignments` = true**.
- Sample: `English → LKG`, `English → UKG`, `English → Class 1`.

### teacher_class_assignments
- `id uuid PK`, `teacher_id -> school_teachers.id`, `class_name text`, `section text NULL`, `school_id -> schools.id`, `created_at`.
- Indexes: `pkey`, unique `(teacher_id, class_name, section)`.
- school_id: yes. academic_year_id: no.
- SELECT RLS: admins manage all for their school; teachers see only their own rows. **No accountant/public SELECT.**
- Sample: `teacher 5e98… → Class 2/A`, `Class 2/B`, `teacher 3a9b… → Class 3/A`. Only **5 rows total** across the platform.

### teacher_subject_assignments
- `id uuid PK`, `teacher_id -> school_teachers.id`, `subject_id -> subjects.id`, `school_id -> schools.id`, `class_name text NOT NULL`, `created_at`. **No `section` column.**
- Indexes: `pkey`, unique `(teacher_id, subject_id, class_name)`.
- school_id: yes. academic_year_id: no.
- SELECT RLS: admins for their school; teachers their own rows.
- Sample: `teacher 5e98… → subject 88e7… → Class 2`, `→ Class 3`. 14 rows total.

### student_enrollments
- `id uuid PK`, `student_id -> students.id`, `academic_year_id -> academic_years.id`, `class_name text NULL`, `section text NULL`, `created_at`.
- Indexes: `pkey`, unique `(student_id, academic_year_id)`.
- school_id: **not present** — must be reached via `students.school_id`.
- academic_year_id: yes.
- SELECT RLS: admins via the student's school, **plus `Public can view enrollments by student` = true for `anon`**.
- Sample: `Class 5/A`, `Class 5/A`, `Class 5/B` for year `a9f6…`. 579 rows, 33 distinct class|section combos, 0 null sections.

## 2. Answers

**A. Active teachers for one school** — `select * from school_teachers where school_id = :school and is_active = true and role = 'teacher'`. Exclude `role='accountant'` (accountants live in the same table). Teachers are not year-scoped.

**B. Valid class/section combinations for one academic year** — `select distinct class_name, section from student_enrollments e join students s on s.id = e.student_id where s.school_id = :school and e.academic_year_id = :year and class_name is not null`. This is the only year-aware source. `schools.default_classes/default_sections` is a fallback for a school with no enrollments yet.

**C. Subjects per class** — `subject_class_assignments` joined to `subjects`, filtered by `school_id` and matched on `class_name` (class only, sections inherit). Not year-scoped, so it applies to whichever year is being generated.

**D. Qualified teachers per subject+class** — `teacher_subject_assignments (teacher_id, subject_id, class_name)` joined to active `school_teachers`. `teacher_class_assignments` is a separate, coarser class-teacher/homeroom mapping and should be treated as advisory (preferred-teacher hint), not as the eligibility source.

**E. Inconsistencies found (live counts)**
- 333 `subject_class_assignments` rows have **no qualified teacher at all** for that subject+class — the solver must handle unassignable subjects rather than assume feasibility.
- Only 5 `teacher_class_assignments` rows vs 14 `teacher_subject_assignments` rows; the two tables disagree in coverage and neither is authoritative for sections.
- 2 `teacher_subject_assignments` rows point at teachers with `is_active = false` — always join and filter on active.
- `teacher_subject_assignments` has no `section`, but real classes are split into sections (33 combos). Section-level teacher allocation must be decided by the solver or inferred from `teacher_class_assignments`.
- Assignment tables carry no `academic_year_id`, so they are global per school and silently carry over between years.
- 1 school currently has **two** `is_active = true` academic years (7 active rows overall) — never assume a single active year; take the year id as an explicit input.
- 0 `teacher_subject_assignments` rows reference a class outside `subject_class_assignments`, and 0 school-id mismatches between subjects and their class assignments — those two joins are clean.

**F. Safe to read from a separate service** — `schools`, `academic_years`, `school_teachers`, `subjects`, `subject_class_assignments`, `teacher_class_assignments`, `teacher_subject_assignments`, `student_enrollments`, and `students` (only for `id, school_id, class_name, section` to resolve enrollment→school and headcounts). All are read-only inputs; nothing in the timetable service needs write access to them.

**G. Authentication approach** — the Python service should authenticate to Postgres/PostgREST as a dedicated identity, never with a browser anon key and never by relaxing RLS:
- Preferred: a **dedicated read-only Postgres role** for the timetable service with `SELECT` granted only on the nine tables above, connecting over the pooled Postgres connection string. It bypasses RLS by role design while staying least-privilege, and every query must still filter `school_id = :school` in application code.
- Alternative: use the **service role key** server-side only (held in the service's own secret store, never shipped to a client), calling PostgREST with explicit `school_id` filters. Simpler to wire up but far broader privilege, so it needs strict query review.
- In both cases: the EdZen app calls the timetable service with the school id and academic year id plus a signed short-lived token (HMAC or JWT shared secret) so the service can verify the caller and refuse cross-school requests; the service returns a proposed timetable and the writes back into EdZen happen through the existing authenticated app or an edge function, not from the solver.
- Note on egress: because `schools`, `subjects`, `subject_class_assignments`, and `student_enrollments` already have `true` public-read policies, the service does not widen exposure, but those policies remain a separate pre-existing concern worth tightening independently.
