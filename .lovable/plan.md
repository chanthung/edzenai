# Timetable Data Model — Revised Design (migration-ready, nothing executed)

Nine new tables, every one prefixed `timetable_`. No existing EdZen AI table, policy, or row is touched.

**Source of truth stays where it is:** `schools`, `academic_years`, `school_teachers`, `subjects`, `students`, `student_enrollments`, `subject_class_assignments`, `teacher_subject_assignments`, `teacher_class_assignments`. No duplicate teacher/subject/student/class/section/school/year tables are created. Classes and sections travel as `class_name text` / `section text`, matching `student_enrollments` exactly.

**Shared conventions:** `id uuid primary key default gen_random_uuid()`; `created_at`/`updated_at timestamptz not null default now()`; `school_id uuid not null references public.schools(id) on delete cascade` on all nine tables; `academic_year_id uuid references public.academic_years(id) on delete cascade` on every table except `timetable_rooms` (year-independent) and optional on `timetable_room_requirements`.

## 1. timetable_settings
One configuration row per school per academic year.

Columns: `school_id` (req), `academic_year_id` (req), `working_days smallint[] not null` (ISO 1=Mon…7=Sun), `day_start_time time not null`, `default_period_minutes smallint not null`, `periods_per_day smallint not null`, `is_active boolean not null default true`.

FKs: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`.

Indexes:
- `UNIQUE (school_id, academic_year_id)` — plain table constraint; guarantees one config per school-year.
- `INDEX (school_id)` — tenant-scoped lookups and RLS filtering.

## 2. timetable_rooms
Physical room inventory. Year-independent by design: rooms outlive an academic year.

Columns: `school_id` (req), `name text not null`, `room_type text not null` with CHECK in (`classroom`,`science_lab`,`computer_lab`,`library`,`art`,`music`,`sports`,`auditorium`,`other`), `capacity int`, `is_active boolean not null default true`.

FK: `school_id -> public.schools(id)`.

Indexes:
- `CREATE UNIQUE INDEX timetable_rooms_school_name_uidx ON public.timetable_rooms (school_id, lower(name));` — expression-based, so it must be a unique index, not a table constraint. Prevents "Lab 1" / "lab 1" duplicates per school.
- `CREATE INDEX timetable_rooms_type_idx ON public.timetable_rooms (school_id, room_type) WHERE is_active;` — solver's "find me an active science lab" lookup.

## 3. timetable_room_requirements
Which room type a subject needs.

Columns: `school_id` (req), `subject_id uuid not null`, `academic_year_id uuid null` (null = every year), `class_name text null` (null = all classes), `required_room_type text null`, `preferred_room_id uuid null`, `is_mandatory boolean not null default false`.

FKs: `school_id -> public.schools(id)`, `subject_id -> public.subjects(id)`, `academic_year_id -> public.academic_years(id)`, `preferred_room_id -> public.timetable_rooms(id)`.

Indexes (nullable columns force expression/partial indexes, not constraints):
- `CREATE UNIQUE INDEX timetable_room_req_uidx ON public.timetable_room_requirements (subject_id, coalesce(class_name,''), coalesce(academic_year_id,'00000000-0000-0000-0000-000000000000'::uuid));` — one rule per subject/class/year combination including the "applies to all" nulls.
- `CREATE INDEX timetable_room_req_lookup_idx ON public.timetable_room_requirements (school_id, subject_id);` — solver resolves room needs per subject.

## 4. timetable_time_slots
The concrete grid of teachable periods. Authoritative — days may differ.

Columns: `school_id` (req), `academic_year_id` (req), `weekday smallint not null` CHECK 1–7, `period_number smallint not null`, `start_time time not null`, `end_time time not null`, `is_active boolean not null default true`.

FKs: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`.

Indexes:
- `UNIQUE (academic_year_id, weekday, period_number)` — plain constraint; one slot per period per weekday per year.
- `CREATE INDEX timetable_time_slots_grid_idx ON public.timetable_time_slots (school_id, academic_year_id, weekday) WHERE is_active;` — the solver's primary grid scan.

## 5. timetable_breaks
Recess/lunch/assembly placed after a given period; not teachable slots.

Columns: `school_id` (req), `academic_year_id` (req), `weekday smallint null` (null = all working days), `break_type text not null` CHECK in (`short_break`,`lunch`,`assembly`,`prayer`,`other`), `after_period smallint not null`, `duration_minutes smallint not null`, `is_active boolean not null default true`.

FKs: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`.

Indexes:
- `CREATE UNIQUE INDEX timetable_breaks_uidx ON public.timetable_breaks (academic_year_id, coalesce(weekday, 0), after_period, break_type);` — expression-based (nullable weekday), so a unique index. Stops duplicate lunches after the same period.
- `CREATE INDEX timetable_breaks_year_idx ON public.timetable_breaks (school_id, academic_year_id);` — render breaks alongside the grid.

## 6. timetable_teacher_availability
Exceptions only — absence of a row means the teacher is available.

Columns: `school_id` (req), `teacher_id uuid not null`, `academic_year_id` (req), `time_slot_id uuid not null`, `is_available boolean not null default true`, `reason text null`.

FKs: `school_id -> public.schools(id)`, `teacher_id -> public.school_teachers(id) on delete cascade`, `academic_year_id -> public.academic_years(id)`, `time_slot_id -> public.timetable_time_slots(id) on delete cascade`.

Indexes:
- `UNIQUE (teacher_id, time_slot_id)` — plain constraint; one exception per teacher per slot.
- `CREATE INDEX timetable_teacher_avail_idx ON public.timetable_teacher_availability (school_id, academic_year_id, teacher_id);` — solver loads one teacher's exceptions in one seek.

## 7. timetable_subject_requirements
The demand table: how much of each subject each section needs.

Columns: `school_id` (req), `academic_year_id` (req), `class_name text not null`, `section text null`, `subject_id uuid not null`, `periods_per_week smallint not null`, `delivery_mode text not null default 'theory'` CHECK in (`theory`,`practical`,`lab`,`activity`,`online`), `elective_group text null`, `consecutive_periods smallint not null default 1`, `preferred_weekdays smallint[] null`, `priority smallint not null default 5`, `status text not null default 'active'` CHECK in (`active`,`draft`,`archived`).

FKs: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`, `subject_id -> public.subjects(id)`.

Indexes:
- `CREATE UNIQUE INDEX timetable_subject_req_uidx ON public.timetable_subject_requirements (academic_year_id, class_name, coalesce(section,''), subject_id, coalesce(elective_group,''));` — expression-based; one demand row per section/subject/elective option.
- `CREATE INDEX timetable_subject_req_year_idx ON public.timetable_subject_requirements (school_id, academic_year_id);` — bulk load of a year's demand.
- `CREATE INDEX timetable_subject_req_subject_idx ON public.timetable_subject_requirements (subject_id);` — reverse lookup when a subject changes.

## 8. timetable_runs
One solver execution, so timetables are versioned and reviewable before publishing.

Columns: `school_id` (req), `academic_year_id` (req), `status text not null default 'pending'` CHECK in (`pending`,`running`,`solved`,`infeasible`,`published`,`discarded`), `requested_by uuid null`, `solver_stats jsonb null`, `constraints_snapshot jsonb null`, `notes text null`, `started_at timestamptz null`, `completed_at timestamptz null`.

FKs: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`.

Indexes:
- `CREATE INDEX timetable_runs_status_idx ON public.timetable_runs (school_id, academic_year_id, status);` — list runs, find the live one.
- **Single published run rule:** `CREATE UNIQUE INDEX timetable_runs_one_published_uidx ON public.timetable_runs (school_id, academic_year_id) WHERE status = 'published';` — a partial unique index enforcing at most one published run per school-year at the database level. Older runs keep their `solved`/`discarded` status and all their entries, so history and audit stay intact; publishing a new run means demoting the old one in the same transaction.

## 9. timetable_entries
The resulting schedule — one row per scheduled period.

Columns: `school_id` (req), `run_id uuid not null`, `academic_year_id` (req), `class_name text not null`, `section text null`, `time_slot_id uuid not null`, `subject_id uuid not null`, `teacher_id uuid null`, `room_id uuid null`, `elective_group text null`, `is_locked boolean not null default false`.

FKs: `school_id -> public.schools(id)`, `run_id -> public.timetable_runs(id) on delete cascade`, `academic_year_id -> public.academic_years(id)`, `time_slot_id -> public.timetable_time_slots(id)`, `subject_id -> public.subjects(id)`, `teacher_id -> public.school_teachers(id)`, `room_id -> public.timetable_rooms(id)`.

Indexes (all three uniques are expression or partial, hence indexes, not constraints):
- `CREATE UNIQUE INDEX timetable_entries_section_slot_uidx ON public.timetable_entries (run_id, class_name, coalesce(section,''), time_slot_id, coalesce(elective_group,''));` — a section can hold only one subject per slot, except parallel electives.
- `CREATE UNIQUE INDEX timetable_entries_teacher_slot_uidx ON public.timetable_entries (run_id, teacher_id, time_slot_id) WHERE teacher_id IS NOT NULL;` — makes teacher double-booking impossible regardless of solver bugs.
- `CREATE UNIQUE INDEX timetable_entries_room_slot_uidx ON public.timetable_entries (run_id, room_id, time_slot_id) WHERE room_id IS NOT NULL;` — same guarantee for rooms.
- `CREATE INDEX timetable_entries_run_idx ON public.timetable_entries (school_id, academic_year_id, run_id);` — render a whole timetable in one scan.

## Scoping confirmation

| Table | school_id | academic_year_id |
|---|---|---|
| timetable_settings | required | required |
| timetable_rooms | required | intentionally absent (year-independent) |
| timetable_room_requirements | required | optional (null = all years) |
| timetable_time_slots | required | required |
| timetable_breaks | required | required |
| timetable_teacher_availability | required | required |
| timetable_subject_requirements | required | required |
| timetable_runs | required | required |
| timetable_entries | required | required |

## Electives in V1

`elective_group text` on `timetable_subject_requirements` and `timetable_entries` lets several subjects occupy one slot for a section, so parallel options schedule correctly without any student-group table. Per-student cohort membership can be added later as a separate `timetable_student_groups` / membership pair keyed on the same `elective_group` value — the nine core tables above do not change when that happens.

## Python service write boundary

The Python/OR-Tools service **reads** `schools`, `academic_years`, `school_teachers`, `subjects`, `subject_class_assignments`, `teacher_subject_assignments`, `teacher_class_assignments`, `student_enrollments` and all `timetable_*` configuration tables. It **writes only** `timetable_runs` and `timetable_entries`. It never writes to any existing EdZen AI operational table. This is enforced by giving its service role INSERT/UPDATE on just those two tables.

## Migration notes (not executed)

- One migration creating all nine tables in dependency order: rooms → settings → time_slots → breaks → room_requirements → teacher_availability → subject_requirements → runs → entries.
- Each `CREATE TABLE` is immediately followed by `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated;` and `GRANT ALL ... TO service_role;`, then `ENABLE ROW LEVEL SECURITY`, then policies.
- Policies scope writes to `school_id IN (SELECT get_user_school_ids())` and grant read access via `get_teacher_school_ids()`.
- `update_updated_at_column()` trigger on every table carrying `updated_at`.
- Known data realities to absorb: `teacher_subject_assignments` has no `section` column; 333 subject/class pairs currently have no qualified teacher; two assignment rows point at inactive teachers; one school has two active academic years. The service therefore takes `academic_year_id` as an explicit input, joins eligibility through active `school_teachers`, and reports unassignable requirements as an infeasibility reason on `timetable_runs`.

Nothing is created until this design is approved.
