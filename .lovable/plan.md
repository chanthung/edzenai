# Proposed Timetable Data Model (design only — nothing built)

Nine new tables, all prefixed `timetable_`/`tt_`-style and additive. No existing table, policy, or row is touched. Teachers, subjects, students, schools, academic years, classes and sections stay in the existing EdZen AI tables and are referenced by id or by the same `class_name` / `section` text convention already used in `student_enrollments`.

Convention used throughout: `id uuid PK default gen_random_uuid()`, `created_at/updated_at timestamptz not null default now()`, `school_id uuid not null references schools(id) on delete cascade` on every table (needed for RLS scoping), and `class_name`/`section` as `text` matching `student_enrollments` exactly.

## 1. timetable_settings
Purpose: one configuration per school per academic year.
- `id`, `school_id` (req), `academic_year_id uuid not null -> academic_years(id)`
- `working_days smallint[] not null` (ISO 1=Mon…7=Sun)
- `day_start_time time not null`, `default_period_minutes smallint not null`, `periods_per_day smallint not null`
- `is_active boolean not null default true`
- PK `id`; FK school, academic year; unique `(school_id, academic_year_id)`; index on `school_id`.
- academic_year_id: required.

## 2. rooms
Purpose: physical room inventory per school (not year-scoped, rooms outlive a year).
- `id`, `school_id` (req), `name text not null`, `room_type text not null` (`classroom|science_lab|computer_lab|library|art|music|sports|auditorium|other`), `capacity int`, `is_active boolean not null default true`
- PK `id`; unique `(school_id, lower(name))`; index `(school_id, room_type) where is_active`.
- academic_year_id: not required.

## 3. subject_room_requirements
Purpose: which room a subject needs.
- `id`, `school_id` (req), `subject_id uuid not null -> subjects(id)`, `academic_year_id uuid null`, `class_name text null` (null = applies to all classes)
- `required_room_type text null`, `preferred_room_id uuid null -> rooms(id)`, `is_mandatory boolean not null default false`
- PK `id`; unique `(subject_id, coalesce(class_name,''), coalesce(academic_year_id,'…'))`; index `(school_id, subject_id)`.
- academic_year_id: optional (null = applies to every year).

## 4. time_slots
Purpose: the concrete grid of teachable periods; generated from settings but stored so days can differ.
- `id`, `school_id` (req), `academic_year_id` (req), `weekday smallint not null` (1–7), `period_number smallint not null`, `start_time time not null`, `end_time time not null`, `is_active boolean not null default true`
- PK `id`; unique `(academic_year_id, weekday, period_number)`; index `(school_id, academic_year_id, weekday) where is_active`.

## 5. timetable_breaks
Purpose: recess/lunch/assembly, placed after a given period.
- `id`, `school_id` (req), `academic_year_id` (req), `weekday smallint null` (null = all working days), `break_type text not null` (`short_break|lunch|assembly|prayer|other`), `after_period smallint not null`, `duration_minutes smallint not null`, `is_active boolean not null default true`
- PK `id`; unique `(academic_year_id, coalesce(weekday,0), after_period, break_type)`; index `(school_id, academic_year_id)`.

## 6. teacher_availability
Purpose: per-teacher blocked or free slots.
- `id`, `school_id` (req), `teacher_id uuid not null -> school_teachers(id) on delete cascade`, `academic_year_id` (req), `time_slot_id uuid not null -> time_slots(id) on delete cascade`, `is_available boolean not null default true`, `reason text null`
- PK `id`; unique `(teacher_id, time_slot_id)`; index `(school_id, academic_year_id, teacher_id)`.
- Default rule: absence of a row means available; rows are exceptions only.

## 7. subject_requirements
Purpose: the solver's demand table — how much of each subject each section needs.
- `id`, `school_id` (req), `academic_year_id` (req), `class_name text not null`, `section text null`, `subject_id uuid not null -> subjects(id)`
- `periods_per_week smallint not null`, `delivery_mode text not null default 'theory'` (`theory|practical|lab|activity|online`)
- `elective_group text null`, `consecutive_periods smallint not null default 1`, `preferred_weekdays smallint[] null`, `priority smallint not null default 5`, `status text not null default 'active'` (`active|draft|archived`)
- PK `id`; unique `(academic_year_id, class_name, coalesce(section,''), subject_id, coalesce(elective_group,''))`; indexes `(school_id, academic_year_id)`, `(subject_id)`.

## 8. timetable_runs
Purpose: one solver execution, so generated timetables are versioned and reviewable before publishing.
- `id`, `school_id` (req), `academic_year_id` (req), `status text not null default 'pending'` (`pending|running|solved|infeasible|published|discarded`), `requested_by uuid null`, `solver_stats jsonb null`, `constraints_snapshot jsonb null`, `notes text null`, `started_at`, `completed_at`
- PK `id`; index `(school_id, academic_year_id, status)`.

## 9. timetable_entries
Purpose: the resulting schedule — one row per scheduled period.
- `id`, `school_id` (req), `run_id uuid not null -> timetable_runs(id) on delete cascade`, `academic_year_id` (req)
- `class_name text not null`, `section text null`, `time_slot_id uuid not null -> time_slots(id)`, `subject_id uuid not null -> subjects(id)`, `teacher_id uuid null -> school_teachers(id)`, `room_id uuid null -> rooms(id)`, `elective_group text null`, `is_locked boolean not null default false`
- PK `id`; unique `(run_id, class_name, coalesce(section,''), time_slot_id, coalesce(elective_group,''))`; unique `(run_id, teacher_id, time_slot_id) where teacher_id is not null`; unique `(run_id, room_id, time_slot_id) where room_id is not null`; index `(school_id, academic_year_id, run_id)`.

The last two partial unique indexes make double-booking a teacher or room impossible at the database level, independent of the solver.

## How the model handles each case

**A. Class 5-A vs Class 5-B** — `class_name` + `section` travel together on `subject_requirements` and `timetable_entries`, matching the text values already in `student_enrollments`. Each section gets its own demand rows and its own schedule rows, so 5-A and 5-B are fully independent while sharing subject and teacher records.

**B. Different years** — `timetable_settings`, `time_slots`, `timetable_breaks`, `teacher_availability`, `subject_requirements`, `timetable_runs` and `timetable_entries` all carry `academic_year_id`. A new year starts from a clean configuration and old years stay intact for reference. Only `rooms` (physical inventory) and optionally `subject_room_requirements` are year-independent.

**C. Teacher availability** — `teacher_availability` rows are exceptions against the `time_slots` grid; no row means the teacher is free. The solver reads only active teachers from `school_teachers` (`is_active = true`, `role = 'teacher'`) and subtracts unavailable slots.

**D. Labs and special rooms** — `rooms.room_type` classifies the inventory; `subject_room_requirements` states that, say, Physics needs `science_lab`, optionally naming a `preferred_room_id`, with `is_mandatory` deciding whether the solver may fall back to a normal classroom. The room double-booking index enforces one class per room per slot.

**E. Mathematics = 5 periods/week** — one `subject_requirements` row per section with `periods_per_week = 5`; `consecutive_periods` handles double lab periods, `preferred_weekdays` spreads or clusters them, and `priority` decides what gets sacrificed first when the grid is tight.

**F. Different period counts per weekday** — `timetable_settings` only holds the default; `time_slots` is the authority. A Saturday with four periods simply has four active rows, and `is_active = false` retires a slot without deleting history.

**G. Breaks after different periods** — each break row names the period it follows and, optionally, the weekday. Breaks are not teachable slots: they sit between `time_slots` rows and shift the displayed clock times rather than consuming a period.

**H. Electives, vocational, interdisciplinary, mixed groups** — `elective_group` on both `subject_requirements` and `timetable_entries` lets several subjects share one slot for a section, so students split across parallel options without breaking the per-section uniqueness rule. `subjects.subject_type` (`academic|co_curricular|vocational`) already distinguishes the category, and `delivery_mode` covers activity/practical formats. Mixed-group blocks across sections can later be modelled by adding a nullable group table without changing these tables.

**I. Future substitutions** — `timetable_entries` is the published baseline and `is_locked` protects manually pinned rows. Substitution can later be a thin `timetable_substitutions` table (`entry_id`, `date`, `original_teacher_id`, `substitute_teacher_id`, `reason`) that overlays a single date without editing the baseline, reusing `teacher_availability` to find free staff.

## Known data realities the design must absorb

From the earlier read-only audit: `teacher_subject_assignments` has no `section` column, 333 subject/class pairs currently have no qualified teacher, two assignment rows point at inactive teachers, and one school has two academic years flagged active. So the service should take `academic_year_id` as an explicit input, always join teacher eligibility through active `school_teachers`, and report unassignable `subject_requirements` rows as an infeasibility reason on `timetable_runs` rather than failing silently.

## Technical notes

- Every table needs RLS enabled plus `GRANT SELECT/INSERT/UPDATE/DELETE ... TO authenticated` and `GRANT ALL ... TO service_role` in the same migration, scoped by `school_id IN (SELECT get_user_school_ids())` for admins and `get_teacher_school_ids()` for read-only teacher access.
- The Python/OR-Tools service reads settings, slots, breaks, availability, requirements, rooms and the existing assignment tables, then writes only `timetable_runs` and `timetable_entries`.
- Nothing is created until this design is approved.
