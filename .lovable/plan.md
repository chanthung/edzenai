## Plan: Multi-Role User Management (Teacher + Accountant)

### Database Changes
1. **Add `accountant` to `app_role` enum** — so both teacher and accountant are recognized system-wide
2. **Add `role` column to `school_teachers` table** — defaults to `'teacher'`, values: `'teacher'` or `'accountant'`
3. **Update RLS policies** — accountants get access to fee-related tables (fee_structures, payments, students read-only)

### Backend Changes
4. **Update `create-teacher` Edge Function** — accept a `role` parameter, insert correct role into `user_roles` and `school_teachers`
5. **Update `useUserRole` hook** — detect accountant role and expose `isAccountant` flag

### Frontend Changes
6. **Rename "Teachers" → "Users"** in sidebar nav and page title
7. **Add role selector** in the create/edit user dialogs (Teacher / Accountant dropdown)
8. **Update users table** to show Role column
9. **Role-based navigation:**
   - **Teacher layout**: Student Progress, Attendance only (unchanged)
   - **Accountant layout**: New layout showing Dashboard, Students, Fee Setup, Settings
   - **Admin layout**: Full access (unchanged)
10. **Create `AccountantLayout`** — similar to TeacherLayout but with fee-focused nav items

### Access Control Logic
- `useUserRole` returns `role: 'teacher' | 'accountant' | 'school_admin' | 'platform_admin'`
- `App.tsx` routes accountants to their permitted pages
- Accountants see: Dashboard, Students (read-only list), Fee Setup, Payments
- Teachers see: Student Progress module only (unchanged)
