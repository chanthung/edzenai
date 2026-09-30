# Read-only Timetable View

A new **View** sub-tab inside Settings → Timetable shows the saved timetable. It only reads data. Nothing that exists today gets changed: the settings sections, timetable-api, the generator and the tables all stay as they are.

## What the user sees

- The view uses the **same academic-year picker** already at the top of the Timetable tab. Changing the year changes the timetable shown. No year IDs are hard-coded.
- It finds the latest run for this school and the selected year whose status is `solved` or `published`, newest first.
- There are three view buttons: **Class** (the default), **Teacher** and **Room**, each with its own picker:
  - Class + section: the first one found in the saved timetable is picked automatically.
  - Teacher.
  - Room.
- The weekly grid has columns Monday–Friday and one row per period (Period 1, 2, …). Each row shows its real start and end times.
- Each cell shows the subject, the teacher and the room. If there is no room, that line is left out, so it never says "undefined".
- Break rows come only from the saved break settings (for example "Lunch · 30 min after Period 4"). No break times are made up.
- Empty messages:
  - "No generated timetable is available for this academic year."
  - "This timetable run contains no timetable entries."
  - "No periods for this selection" when a teacher or room has nothing scheduled.

## Security

- The page uses the signed-in user's school from the existing school lookup and the normal signed-in connection. It never uses privileged keys.
- The existing access rules already limit runs and entries to the user's own school: admins can read, and teachers get read-only access. Every query also filters by the school and the year.

## Technical details

- New `src/hooks/timetable/useTimetableView.ts` (react-query):
  1. Run: `timetable_runs` where school_id and academic_year_id match and `status in ('solved','published')`, ordered by created_at desc, limit 1.
  2. Entries: `timetable_entries` where run_id and school_id match.
  3. Lookups, fetched in parallel: `timetable_time_slots` (school + year), `subjects`, `school_teachers` and `timetable_rooms` (school), plus the existing `useTimetableBreaks`.
  4. Join them in memory into maps keyed by id.
- New `src/components/admin/timetable/TimetableViewSection.tsx`: the mode toggle, the pickers and the grid. Rows are built from the distinct period_numbers in the slots. Each break row goes after its `after_period`, and a break for one weekday only shows in that day's column. Styling uses the existing Card, Tabs, Select and Badge parts and design tokens.
- `TimetableSettingsTab.tsx`: add one new `TabsTrigger` / `TabsContent` ("View"). Nothing else in that file changes.
- No migrations, no changes to edge functions and no new packages.
