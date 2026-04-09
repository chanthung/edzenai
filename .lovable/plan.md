

# Assessment: Timetable-Based Teacher System

## Current State (Already Working)

The recent changes have **already fixed** the core subject visibility problem:

1. **`useMySubjectIds`** — fetches only the logged-in teacher's assigned subjects from `teacher_subject_assignments`
2. **`useSubjects` / `useSubjectsWithClasses`** — now accept `teacherSubjectIds` filter and apply `.in('id', teacherSubjectIds)`
3. **`useMyClassAssignments`** — derives classes from `teacher_subject_assignments → subject_class_assignments` (no manual class assignment)
4. **Subjects page** — hides Add/Edit/Delete for teachers, shows only assigned subjects
5. **Marks Entry** — filters subjects by teacher assignment
6. **Attendance** — filters classes by derived class assignments, includes time field

The relationship chain `Teacher → teacher_subject_assignments → subjects → subject_class_assignments → classes` is **already enforced**.

## Timetable Proposal: Risk Assessment

| Aspect | Risk Level | Reason |
|--------|-----------|--------|
| New `timetable` table | Medium | Large schema addition, new RLS policies, new admin UI |
| Linking attendance to `timetable_id` | **High** | Breaks existing attendance flow; attendance is currently class-level, not period-level |
| Replacing subject/class dropdowns with timetable-driven UI | **High** | Removes flexibility; many schools don't follow rigid timetables |
| Timetable Builder admin UI | Medium | Significant new feature (day/period grid, conflict detection, teacher filtering) |
| "Today's Schedule" dashboard | Low | Additive feature, no existing code affected |

## Recommendation: Do NOT Integrate As Proposed

The timetable system as described would:

1. **Break existing attendance** — Current attendance is one record per student per day. Switching to period-wise attendance is a fundamental model change that affects parent views, report cards, and attendance summaries.

2. **Over-constrain marks entry** — Many schools enter marks for subjects that don't follow a strict daily schedule (exams, projects). Removing the dropdown forces a rigid model.

3. **Duplicate solved problems** — Subject visibility and class derivation are already fixed. The timetable adds complexity to solve an already-solved problem.

4. **Require massive UI work** — Timetable builder, schedule view, period-wise attendance, conflict detection — this is essentially a new module.

## What Could Be Added Safely (Phase 2, Optional)

If a timetable feature is desired later, it should be **additive** — not replacing existing flows:

- **New `timetable` table** as a standalone feature
- **"Today's Schedule" card** on teacher dashboard (read-only, informational)
- **Timetable Builder** in admin panel as a separate page
- Attendance and Marks Entry remain unchanged (current dropdown approach works)

This would be a separate feature request, not a fix — since the underlying subject/class filtering is already working correctly.

## Summary

The proposed timetable system solves problems that are **already fixed** and introduces **high-risk breaking changes** to attendance and marks entry. The current subject-assignment-based architecture is simpler, working, and sufficient. A timetable can be added as an optional scheduling tool later without replacing core workflows.

