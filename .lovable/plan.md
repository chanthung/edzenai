# Add Employee ID to Users

Each teacher/accountant gets an editable Employee ID (the school's own staff code), set at invite time and editable later.

## What changes

1. **Users table** — new "Employee ID" column between Name and Email. Shows the code, or a muted dash when not set.
2. **Add User dialog** — optional "Employee ID" field; saved with the invite and carried to the staff record when the invite is accepted.
3. **Edit Teacher dialog** — Employee ID field, editable and saved with the rest of the form.
4. **Exports** — include Employee ID as a column wherever staff lists are exported/printed.
5. Duplicate codes within the same school are blocked with a clear inline error; blank is allowed.

## Technical notes

- Migration (additive, nullable): `employee_id text` on `public.school_teachers` and on `public.user_invites`; partial unique index on `(school_id, lower(employee_id))` where the value is not null.
- Invite acceptance edge function copies `employee_id` from the invite into the created `school_teachers` row.
- `useTeachers` (`Teacher` interface, invite mutation, update mutation) extended to read/write the new field; UI updated in `src/pages/admin/Teachers.tsx` and `src/components/admin/EditTeacherDialog.tsx`.
- No changes to roles, permissions, or auth.
