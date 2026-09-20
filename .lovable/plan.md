# Timetable Data Model — Revised Design v3 (multi-tenant hardened, migration-ready, nothing executed)

Nine additive tables, all prefixed `timetable_`. No existing EdZen AI table, policy, column, or row is altered. Source of truth stays in `schools`, `academic_years`, `school_teachers`, `subjects`, `students`, `student_enrollments`, `subject_class_assignments`, `teacher_subject_assignments`, `teacher_class_assignments`. Classes/sections remain `class_name text` / `section text`, matching `student_enrollments`.

Shared conventions: `id uuid primary key default gen_random_uuid()`; `created_at`/`updated_at timestamptz not null default now()`; `school_id uuid not null references public.schools(id) on delete cascade` on **all nine** tables; `academic_year_id` required everywhere except `timetable_rooms` (year-independent) and optional on `timetable_room_requirements`.

## Tenant-isolation strategy in one paragraph

Ordinary single-column foreign keys prove a row *exists* but not that it belongs to the *same tenant*. So every timetable table carries its own `school_id` (and `academic_year_id` where applicable), and references between **timetable tables** are upgraded to **composite foreign keys** that include those columns — making a cross-school or cross-year reference physically impossible. References into **existing EdZen AI tables** (`subjects`, `school_teachers`) cannot use composite FKs without adding constraints to those tables, which the additive rule forbids; those are enforced by tightly scoped `BEFORE INSERT OR UPDATE` validation triggers instead. RLS then scopes every row to the caller's schools on all four verbs.

Composite FKs require matching unique keys on the parent. Each timetable parent therefore declares a redundant-but-cheap unique key alongside its primary key:

- `timetable_rooms`: `UNIQUE (id, school_id)`
- `timetable_time_slots`: `UNIQUE (id, school_id, academic_year_id)`
- `timetable_runs`: `UNIQUE (id, school_id, academic_year_id)`

None of these touch existing tables.

---

## 1. timetable_settings
One configuration row per school per academic year.

Columns: `school_id` (req), `academic_year_id` (req), `working_days smallint[] not null` (ISO 1=Mon…7=Sun), `day_start_time time not null`, `default_period_minutes smallint not null`, `periods_per_day smallint not null`, `is_active boolean not null default true`.

Foreign keys:
- `school_id -> public.schools(id)` ON DELETE CASCADE
- `academic_year_id -> public.academic_years(id)` ON DELETE CASCADE

Trigger `timetable_settings_tenant_check`: asserts `academic_years.school_id = NEW.school_id` — stops School A pointing its settings at School B's academic year.

Indexes:
- `UNIQUE (school_id, academic_year_id)` — one config per school-year; also the tenant key for lookups.
- `INDEX (school_id)` — RLS filtering and tenant-scoped scans.

## 2. timetable_rooms
Physical inventory. Year-independent by design (rooms outlive a year) but strictly school-scoped.

Columns: `school_id` (req), `name text not null`, `room_type text not null` CHECK in (`classroom`,`science_lab`,`computer_lab`,`library`,`art`,`music`,`sports`,`auditorium`,`other`), `capacity int`, `is_active boolean not null default true`.

Foreign key: `school_id -> public.schools(id)` ON DELETE CASCADE.

Indexes:
- `UNIQUE (id, school_id)` — target for composite FKs from entries and room requirements; guarantees a referenced room is the referencing school's room.
- `CREATE UNIQUE INDEX timetable_rooms_school_name_uidx ON public.timetable_rooms (school_id, lower(name));` — expression-based, hence an index not a constraint. Two schools may both have "Lab 1"; one school may not.
- `CREATE INDEX timetable_rooms_type_idx ON public.timetable_rooms (school_id, room_type) WHERE is_active;` — solver's "find an active science lab in this school" lookup.

## 3. timetable_room_requirements
Which room type a subject needs.

Columns: `school_id` (req), `subject_id uuid not null`, `academic_year_id uuid null` (null = all years), `class_name text null` (null = all classes), `required_room_type text null`, `preferred_room_id uuid null`, `is_mandatory boolean not null default false`.

Foreign keys:
- `school_id -> public.schools(id)` ON DELETE CASCADE
- `subject_id -> public.subjects(id)` ON DELETE CASCADE — same-school check by trigger (see below)
- `academic_year_id -> public.academic_years(id)` ON DELETE CASCADE
- `FOREIGN KEY (preferred_room_id, school_id) -> public.timetable_rooms(id, school_id)` — **composite**; a preferred room from another school cannot be stored (requirement 9).

Trigger `timetable_room_requirements_tenant_check`: asserts `subjects.school_id = NEW.school_id` (requirement 10) and, when `academic_year_id` is not null, `academic_years.school_id = NEW.school_id`.

Indexes:
- `CREATE UNIQUE INDEX timetable_room_req_uidx ON public.timetable_room_requirements (school_id, subject_id, coalesce(class_name,''), coalesce(academic_year_id,'00000000-0000-0000-0000-000000000000'::uuid));` — expression-based; one rule per school/subject/class/year including the "applies to all" nulls.
- `CREATE INDEX timetable_room_req_lookup_idx ON public.timetable_room_requirements (school_id, subject_id);` — solver resolves room needs per subject within a tenant.

## 4. timetable_time_slots
The authoritative grid of teachable periods; days may differ.

Columns: `school_id` (req), `academic_year_id` (req), `weekday smallint not null` CHECK 1–7, `period_number smallint not null`, `start_time time not null`, `end_time time not null` CHECK `end_time > start_time`, `is_active boolean not null default true`.

Foreign keys: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`, both ON DELETE CASCADE.

Trigger `timetable_time_slots_tenant_check`: asserts `academic_years.school_id = NEW.school_id`.

Indexes:
- `UNIQUE (id, school_id, academic_year_id)` — composite-FK target; makes requirements 7 and 8 enforceable in the database.
- `UNIQUE (school_id, academic_year_id, weekday, period_number)` — one slot per period per weekday per school-year (school_id included so the key is tenant-explicit).
- `CREATE INDEX timetable_time_slots_grid_idx ON public.timetable_time_slots (school_id, academic_year_id, weekday) WHERE is_active;` — the solver's primary grid scan.

## 5. timetable_breaks
Recess/lunch/assembly after a given period; not teachable slots.

Columns: `school_id` (req), `academic_year_id` (req), `weekday smallint null` (null = all working days), `break_type text not null` CHECK in (`short_break`,`lunch`,`assembly`,`prayer`,`other`), `after_period smallint not null`, `duration_minutes smallint not null`, `is_active boolean not null default true`.

Foreign keys: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`, both ON DELETE CASCADE. Trigger asserts the year belongs to the school.

Indexes:
- `CREATE UNIQUE INDEX timetable_breaks_uidx ON public.timetable_breaks (school_id, academic_year_id, coalesce(weekday, 0), after_period, break_type);` — expression-based (nullable weekday); no duplicate lunch after the same period.
- `CREATE INDEX timetable_breaks_year_idx ON public.timetable_breaks (school_id, academic_year_id);` — render breaks with the grid.

## 6. timetable_teacher_availability
Exceptions only — no row means available.

Columns: `school_id` (req), `teacher_id uuid not null`, `academic_year_id` (req), `time_slot_id uuid not null`, `is_available boolean not null default true`, `reason text null`.

Foreign keys:
- `school_id -> public.schools(id)` ON DELETE CASCADE
- `teacher_id -> public.school_teachers(id)` ON DELETE CASCADE — same-school check by trigger
- `academic_year_id -> public.academic_years(id)` ON DELETE CASCADE
- `FOREIGN KEY (time_slot_id, school_id, academic_year_id) -> public.timetable_time_slots(id, school_id, academic_year_id)` ON DELETE CASCADE — **composite**; the slot must belong to the same school *and* the same year (requirement 8).

Trigger `timetable_teacher_availability_tenant_check`: asserts `school_teachers.school_id = NEW.school_id` and `academic_years.school_id = NEW.school_id`.

Indexes:
- `UNIQUE (teacher_id, time_slot_id)` — one exception per teacher per slot.
- `CREATE INDEX timetable_teacher_avail_idx ON public.timetable_teacher_availability (school_id, academic_year_id, teacher_id);` — load one teacher's exceptions in a single seek.

## 7. timetable_subject_requirements
Demand table: how much of each subject each section needs.

Columns: `school_id` (req), `academic_year_id` (req), `class_name text not null`, `section text null`, `subject_id uuid not null`, `periods_per_week smallint not null` CHECK > 0, `delivery_mode text not null default 'theory'` CHECK in (`theory`,`practical`,`lab`,`activity`,`online`), `elective_group text null`, `consecutive_periods smallint not null default 1`, `preferred_weekdays smallint[] null`, `priority smallint not null default 5`, `status text not null default 'active'` CHECK in (`active`,`draft`,`archived`).

Foreign keys: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`, `subject_id -> public.subjects(id)`, all ON DELETE CASCADE.

Trigger `timetable_subject_requirements_tenant_check`: asserts `subjects.school_id = NEW.school_id` (requirement 10) and `academic_years.school_id = NEW.school_id`.

Indexes:
- `CREATE UNIQUE INDEX timetable_subject_req_uidx ON public.timetable_subject_requirements (school_id, academic_year_id, class_name, coalesce(section,''), subject_id, coalesce(elective_group,''));` — expression-based; one demand row per section/subject/elective option per tenant-year.
- `CREATE INDEX timetable_subject_req_year_idx ON public.timetable_subject_requirements (school_id, academic_year_id);` — bulk load of a year's demand.
- `CREATE INDEX timetable_subject_req_subject_idx ON public.timetable_subject_requirements (school_id, subject_id);` — reverse lookup when a subject changes.

## 8. timetable_runs
One solver execution; timetables are versioned and reviewable before publishing.

Columns: `school_id` (req), `academic_year_id` (req), `status text not null default 'pending'` CHECK in (`pending`,`running`,`solved`,`infeasible`,`published`,`discarded`), `requested_by uuid null`, `solver_stats jsonb null`, `constraints_snapshot jsonb null`, `notes text null`, `started_at timestamptz null`, `completed_at timestamptz null`.

Foreign keys: `school_id -> public.schools(id)`, `academic_year_id -> public.academic_years(id)`, both ON DELETE CASCADE. Trigger asserts the year belongs to the school.

Indexes:
- `UNIQUE (id, school_id, academic_year_id)` — composite-FK target for `timetable_entries` (requirement 6).
- `CREATE INDEX timetable_runs_status_idx ON public.timetable_runs (school_id, academic_year_id, status);` — list runs, find the live one.
- **One published run rule:** `CREATE UNIQUE INDEX timetable_runs_one_published_uidx ON public.timetable_runs (school_id, academic_year_id) WHERE status = 'published';` — partial unique index; at most one published run per school-year. Older runs keep their `solved`/`discarded` status and all their entries, so history and audit stay intact; publishing demotes the previous run in the same transaction.

## 9. timetable_entries
The schedule — one row per scheduled period. This is the table where every isolation rule converges.

Columns: `school_id` (req), `academic_year_id` (req), `run_id uuid not null`, `class_name text not null`, `section text null`, `time_slot_id uuid not null`, `subject_id uuid not null`, `teacher_id uuid null`, `room_id uuid null`, `elective_group text null`, `is_locked boolean not null default false`.

Foreign keys:
- `school_id -> public.schools(id)` ON DELETE CASCADE
- `academic_year_id -> public.academic_years(id)` ON DELETE CASCADE
- `FOREIGN KEY (run_id, school_id, academic_year_id) -> public.timetable_runs(id, school_id, academic_year_id)` ON DELETE CASCADE — **composite**; an entry can only hang off a run with the identical school and year (requirement 6).
- `FOREIGN KEY (time_slot_id, school_id, academic_year_id) -> public.timetable_time_slots(id, school_id, academic_year_id)` — **composite**; School A / Year X entries can only use School A / Year X slots (requirements 3 and 7).
- `FOREIGN KEY (room_id, school_id) -> public.timetable_rooms(id, school_id)` — **composite**; no borrowing another school's room.
- `subject_id -> public.subjects(id)` — same-school check by trigger.
- `teacher_id -> public.school_teachers(id)` — same-school check by trigger.

Trigger `timetable_entries_tenant_check` (BEFORE INSERT OR UPDATE, one row-level function): asserts `subjects.school_id = NEW.school_id`; when `teacher_id` is not null, asserts `school_teachers.school_id = NEW.school_id`; asserts `academic_years.school_id = NEW.school_id`. Raises a clear exception naming the offending column.

Indexes (all three uniques are expression or partial, hence indexes, not constraints):
- `CREATE UNIQUE INDEX timetable_entries_section_slot_uidx ON public.timetable_entries (run_id, class_name, coalesce(section,''), time_slot_id, coalesce(elective_group,''));` — a section holds one subject per slot, except parallel electives. `run_id` is already tenant-bound, so no cross-school collision is possible.
- `CREATE UNIQUE INDEX timetable_entries_teacher_slot_uidx ON public.timetable_entries (run_id, teacher_id, time_slot_id) WHERE teacher_id IS NOT NULL;` — teacher double-booking impossible regardless of solver bugs.
- `CREATE UNIQUE INDEX timetable_entries_room_slot_uidx ON public.timetable_entries (run_id, room_id, time_slot_id) WHERE room_id IS NOT NULL;` — same guarantee for rooms.
- `CREATE INDEX timetable_entries_run_idx ON public.timetable_entries (school_id, academic_year_id, run_id);` — render a whole timetable in one scan.

---

## Isolation coverage matrix

| Cross-tenant risk | Mechanism |
|---|---|
| Entry → run of another school/year | composite FK `(run_id, school_id, academic_year_id)` |
| Entry → time slot of another school/year | composite FK `(time_slot_id, school_id, academic_year_id)` |
| Entry → room of another school | composite FK `(room_id, school_id)` |
| Entry → teacher of another school | trigger on `school_teachers.school_id` |
| Entry → subject of another school | trigger on `subjects.school_id` |
| Availability → slot of another school/year | composite FK `(time_slot_id, school_id, academic_year_id)` |
| Availability → teacher of another school | trigger |
| Room requirement → room of another school | composite FK `(preferred_room_id, school_id)` |
| Room / subject requirement → subject of another school | trigger |
| Any config row → academic year of another school | trigger |
| Any read/write by a user of another school | RLS (below) |

Triggers are used only where composite FKs would require altering an existing EdZen AI table. Nothing outside the nine new tables is modified.

## RLS (requirements 12 and 17)

Every one of the nine tables: `ENABLE ROW LEVEL SECURITY`, plus in the same migration
`GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;` and `GRANT ALL ON public.<table> TO service_role;`. No `anon` grant — timetable data is never public.

Policies per table:
- **Admin full access** — `FOR ALL TO authenticated USING (school_id IN (SELECT get_user_school_ids())) WITH CHECK (school_id IN (SELECT get_user_school_ids()))`. The `WITH CHECK` half is what stops a School A admin writing a row stamped with School B.
- **Teacher read** — `FOR SELECT TO authenticated USING (school_id IN (SELECT get_teacher_school_ids()))`.

`get_user_school_ids()` already grants platform admins every school, which is the intended support path. RLS is never bypassed to simplify the service; the Python service's elevated key is compensated for by explicit authorization checks described next.

## Tenant isolation model end to end (requirement 16)

```text
Browser user (Supabase JWT, sub = auth user id)
      |
      v
Timetable API (Python, server-side)
  1. verify JWT signature against Supabase JWKS -> trusted user id
  2. resolve that user's authorized schools from school_admins /
     school_teachers / user_roles  (never from the request body)
  3. verify requested academic_year_id belongs to an authorized school
  4. reject anything outside that set -> HTTP 403
      |
      v
Supabase / Postgres
  - RLS scopes authenticated reads and writes by school_id
  - composite FKs + triggers reject cross-school / cross-year rows
      |
      v
timetable_* tables (every row carries school_id)
```

**Requirements 13–15 in practice.** The API takes `school_id` and `academic_year_id` as *inputs to validate, never as facts to trust*. A School A user requesting School B's timetable fails at step 2/3: the API returns **HTTP 403** with a generic message, writes an audit line, and returns **no School B data of any kind** — not row counts, not names, not an existence hint (a 404 would itself leak existence, so 403 is returned uniformly). Even if that check were somehow skipped, the database refuses: RLS returns zero rows for a user-token connection, and any attempted write is rejected by `WITH CHECK`, the composite FKs, or the tenant triggers.

**Write boundary (requirement 18), unchanged.** The service reads `schools`, `academic_years`, `school_teachers`, `subjects`, `subject_class_assignments`, `teacher_subject_assignments`, `teacher_class_assignments`, `student_enrollments` and all nine `timetable_*` tables. It writes **only** `timetable_runs` and `timetable_entries`. It never writes `students`, `school_teachers`, `subjects`, `student_enrollments`, `teacher_subject_assignments`, `teacher_class_assignments`, `academic_years`, or `schools`. Enforced by a dedicated database role granted `INSERT/UPDATE/DELETE` on exactly those two tables and `SELECT` elsewhere — not by convention in the Python code.

## Identical names across schools (requirement 19)

Tenant identity is always `school_id`, and every uniqueness rule in this design begins with `school_id` (directly, or transitively through `run_id`, which is itself tenant-bound). So two schools may each have "Class 5", section "A", subject "Mathematics", room "Lab 1", and a teacher named "R. Sharma" with zero possibility of collision, cross-linking, or accidental reuse. Within a single school, `timetable_rooms (school_id, lower(name))` still prevents duplicate room names.

## Electives in V1

`elective_group text` on `timetable_subject_requirements` and `timetable_entries` lets several subjects share one slot for a section, so parallel options schedule correctly without any student-group table. Per-student cohort membership can be added later as a separate membership table keyed on the same `elective_group` value — the nine core tables do not change when that happens.

## Migration notes (not executed)

- One migration, creation order: `timetable_rooms` → `timetable_settings` → `timetable_time_slots` → `timetable_breaks` → `timetable_room_requirements` → `timetable_teacher_availability` → `timetable_subject_requirements` → `timetable_runs` → `timetable_entries`.
- Per table, in this exact order: `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → policies → indexes → triggers.
- One shared `SECURITY DEFINER` validation function per relationship family, `SET search_path = public`, raising descriptive exceptions; attached as `BEFORE INSERT OR UPDATE` row triggers.
- Existing `update_updated_at_column()` reused as a `BEFORE UPDATE` trigger on every table carrying `updated_at`.
- Known data realities to absorb: `teacher_subject_assignments` has no `section` column; 333 subject/class pairs currently have no qualified teacher; two assignment rows point at inactive teachers; one school has two academic years flagged active. The service therefore takes `academic_year_id` as an explicit validated input, joins eligibility through active `school_teachers`, and records unassignable requirements as an infeasibility reason on `timetable_runs` rather than failing silently.

Nothing is created, altered, or migrated until this design is approved.
