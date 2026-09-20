# Timetable Configuration UI

Adds a configuration-only interface for the nine timetable tables. No generation, no publishing, no Python service, no schema changes, no changes to Students, Teachers, Subjects, Academic Years, Fees, Attendance or Progress.

## Where it lives

A new **Timetable** tab inside the existing admin **Settings** page (`/admin/settings`), matching the current tab style used for School, Payments, Templates and Promotion Rules. Visible only to School Admin / Principal (and platform admins managing a school), and read-only when the school is in restricted mode, exactly like the other settings tabs.

At the top of the tab sits a persistent context bar:

```text
Academic Year: [ 2026-2027  v ]        School: Mount Sinai School
```

The year list comes from the school's existing academic years (all of them, not just one active row). The chosen year is remembered for the session, and every sub-screen reads and writes only within that school + year. Rooms are the one exception: they belong to the school, not to a year.

## The seven sub-sections

Shown as a secondary tab strip inside the Timetable tab:

1. **General** — working days (Mon-Sun toggles), school start time, default period length, periods per day. One saved record per school + year, with a Save button and inline validation.
2. **Periods & Time Slots** — a per-weekday list of periods with number, start time, end time and an active switch. Each weekday is independent, so Wednesday can have six periods while Monday has five. A "Generate from General settings" helper pre-fills a weekday from the start time and period length; every row stays editable afterwards. Warns on overlapping or reversed times and on duplicate period numbers.
3. **Breaks** — rows with type (Short Break, Lunch, Assembly, Prayer, Other), applies-to (all working days or one weekday), "after period N", duration in minutes, active switch. Copy explains breaks are not teaching periods.
4. **Rooms** — table of room name, type (Classroom, Science Lab, Computer Lab, Library, Art, Music, Sports, Auditorium, Other), capacity, active. Clearly labelled as shared across all academic years. Duplicate names within a school are blocked.
5. **Teacher Availability** — teachers loaded from the existing staff records (active, role teacher only; no second teacher list). Pick a teacher, then a grid of that year's time slots per weekday; each cell toggles Available / Unavailable with an optional reason. Default is available, so only exceptions get stored. A note states that reasons are visible to administrators only and that teachers can see their own rows only.
6. **Subject Requirements** — class and section options derived from the year's enrolments; subjects per class come from the existing subject-to-class assignments. Each row shows the existing data as read-only context and the timetable settings as editable fields:

```text
Mathematics   Class 5-A          [ Existing subject ]
Periods/week [5]  Mode [Theory v]  Consecutive [1]
Elective group [ ]  Priority [Normal v]  Days [M T W T F]  Status [Active]
```

   Filters by class and section; bulk "apply periods/week to all rows in this class" for speed.
7. **Room Requirements** — per subject (optionally per class/section): required room type, preferred room (from the school's rooms), mandatory yes/no.

Everywhere, existing EdZen AI data is shown in muted read-only chips labelled "Existing", while timetable settings are the editable controls — so admins can see at a glance what they are configuring versus what already exists.

## Empty and error states

Each section has a friendly empty state with the next action ("No periods yet for Monday — add one or generate from your general settings"). If no academic year exists, or a year has no enrolments or subjects, the section explains where that data comes from rather than showing a blank table. Saves produce toast success/error feedback consistent with the rest of the app.

## Security

No school identifier is ever taken from the browser. Every query resolves the signed-in user's authorized school through the existing school hook, and the database row-level rules already created for these tables reject anything outside the user's own school. Teacher availability reasons stay admin-only. Nothing is exposed publicly.

## Technical notes

- New route surface: a `TimetableSettings` tab component under `src/components/admin/timetable/`, with one component per section, mounted from `src/pages/admin/Settings.tsx`.
- New hooks under `src/hooks/timetable/` (`useTimetableSettings`, `useTimetableTimeSlots`, `useTimetableBreaks`, `useTimetableRooms`, `useTimetableTeacherAvailability`, `useTimetableSubjectRequirements`, `useTimetableRoomRequirements`) using react-query with `school_id` + `academic_year_id` filters, mirroring the existing hook patterns.
- A small `TimetableConfigContext` holds the selected academic year for the tab.
- Reads of classes/sections/subjects/teachers reuse the existing tables directly; no duplicates are created.
- Only `timetable_*` configuration tables are written. `timetable_runs` and `timetable_entries` are untouched.
- No migrations. No edge functions. No new dependencies.
