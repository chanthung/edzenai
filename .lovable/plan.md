

## Replace manual password creation with secure invite links for Teachers & Accountants

### Why
Today, school admins must invent and securely share passwords for every teacher/accountant — slow, insecure, and frustrating. Better: send the new user a one-time invite link, they set their own password.

### What changes (user-visible)
1. **"Add New User" dialog redesign**
   - Remove the **Password** and **Confirm Password** fields entirely.
   - Keep: Role, Full Name, Email, Assign Classes & Sections.
   - Add: **Delivery method** toggle — Email (default), WhatsApp, or Both. Phone field appears when WhatsApp is selected.
   - Primary button label: **"Send Invite"**.

2. **On submit**
   - User account is created in a "pending" state (no usable password set).
   - A secure single-use invite link is generated (valid 7 days).
   - Email and/or WhatsApp message sent automatically with the invite link.
   - Toast: "Invite sent to teacher@example.com"

3. **Teachers/Accountants page additions**
   - Each user row shows a **Status pill**: `Invited`, `Active`, or `Invite Expired`.
   - Row action menu adds: **Resend Invite** (regenerates link, sends again) — visible for `Invited` and `Expired` status.
   - "Last invited: 2 days ago" timestamp under name for pending users.

4. **New `/auth/accept-invite` page** (public route)
   - User clicks the link → lands here with token in URL.
   - Validates token → shows their email (read-only) + Set Password + Confirm Password fields (using existing password UI patterns: emerald/destructive border validation).
   - On success → auto-signs them in → redirects to `/progress` (teacher) or `/admin` (accountant).
   - Shows clear error states for: expired link, already used, invalid token.

5. **Existing users unaffected** — the "Reset Password" feature for already-active users stays as-is.

### Technical approach

**Database (one new table)**
```text
user_invites
├── id (uuid, pk)
├── token (uuid, unique, indexed)         ← what goes in the URL
├── email (text)
├── school_id (uuid, fk)
├── role ('teacher' | 'accountant')
├── name (text)
├── invited_by (uuid, fk auth.users)
├── delivery_method ('email' | 'whatsapp' | 'both')
├── phone (text, nullable)
├── expires_at (timestamptz, default now() + 7 days)
├── accepted_at (timestamptz, nullable)
├── created_at, updated_at
```
RLS: school admins manage invites for their school; public can SELECT a single row by token (for the accept page) but only non-expired, non-accepted ones.

**Edge functions (3)**
- `create-user-invite` — replaces direct user creation in `create-teacher`. Creates `user_invites` row, calls `send-transactional-email` with new `user-invite` template, optionally calls Mayavi WhatsApp API. Does NOT create the auth user yet (avoids orphaned accounts if invite expires).
- `accept-user-invite` — called from `/auth/accept-invite`. Validates token, creates `auth.users` with the chosen password, creates `school_teachers` row, assigns `user_roles`, applies pending class/subject assignments stored on the invite, marks invite accepted, returns a session.
- `resend-user-invite` — generates fresh token + expiry, re-sends.

**New transactional email template**
- `user-invite.tsx` in `_shared/transactional-email-templates/` — branded "You've been invited to {schoolName}" with CTA button to the accept link. Registered in `registry.ts`.

**WhatsApp**
- Reuse existing Mayavi integration pattern (per `mem://integrations/whatsapp-direct-messaging`): +91 prepended, 2 retries, throttled. Message: short greeting + invite URL.

**Frontend changes**
- `src/components/admin/EditTeacherDialog.tsx` (Add User dialog) — remove password fields, add delivery toggle, change submit to call `create-user-invite`.
- `src/hooks/useTeachers.ts` — `createTeacher` mutation switched to invoke `create-user-invite`; add `resendInvite` mutation.
- `src/pages/admin/Teachers.tsx` — show invite status pill + Resend menu action + last-invited timestamp.
- `src/pages/auth/AcceptInvite.tsx` — new public page (route added in `App.tsx`).

**Class/subject assignments**
- Store the admin's chosen assignments as JSON on the invite row. Apply them inside `accept-user-invite` once the real user_id exists. This keeps the admin workflow unchanged — they still pick classes upfront.

### Out of scope
- Migrating existing active teachers (they keep working as-is).
- SMS delivery (only Email + WhatsApp, matching the rest of the platform).

### Files to add / change
- **New**: `supabase/functions/create-user-invite/index.ts`, `supabase/functions/accept-user-invite/index.ts`, `supabase/functions/resend-user-invite/index.ts`, `supabase/functions/_shared/transactional-email-templates/user-invite.tsx`, `src/pages/auth/AcceptInvite.tsx`, migration for `user_invites` table + RLS.
- **Edit**: `src/components/admin/EditTeacherDialog.tsx` (or the "Add User" dialog), `src/hooks/useTeachers.ts`, `src/pages/admin/Teachers.tsx`, `src/App.tsx` (route), `_shared/transactional-email-templates/registry.ts`.
- **Memory update**: refresh `mem://features/user-management` to reflect invite-based onboarding.

