# Stage 2: Link Existing HR-Only Teachers

## Inspection findings

- The stable teacher-record key is `school_teachers.id`; the login-account link is `school_teachers.user_id`.
- Invitations have no explicit teacher-record target. Acceptance guesses by Employee ID/name and may insert another record if the intended record changes.
- Linking, assigning the existing role and marking acceptance currently use separate writes. The targeted path needs atomic completion to prevent partial or duplicate links.
- Existing teacher self-access requires `user_id = auth.uid()`; NULL cannot grant access. School-scoped RLS and Employee ID generation/locking remain unchanged.
- Employee IDs are school-unique; account IDs are unique within a school. Outstanding invitations have no target uniqueness protection. The grants inspection returned no rows, so effective grants require a further catalog check before migration.

## What changes after approval

1. **Add User — Teacher only:** keep “Invite a new teacher” and add “Link an existing teacher.” Search current-school, unlinked Teacher records by name or Employee ID; identify missing email addresses. Selecting a record locks its name and Employee ID and prefills email when available. Allow a valid invitation email and a back action. Do not show assignment-editing controls for this path.
2. **Send invitation:** authenticate the administrator and resolve their school on the server. Validate the exact target, email/account conflicts and outstanding invitations. Store the target without linking an account or changing the teacher. Reject duplicate targeted invitations; use existing Cancel/Resend instead of silently replacing them.
3. **Accept invitation:** reuse the existing account-creation and invitation-verification experience. Recheck the exact record and fail clearly if it changed, was deleted or became linked. Atomically link the verified account, add its existing Teacher role to the protected role table and consume the invitation. Never fall back to inserting a teacher. Remove the newly created account if completion fails.
4. **Preserve data:** update only account-link/email fields and login access needed to activate the accepted account. Preserve Employee ID, name, teacher role, HR details, assignments, academic-year scopes and all timetable records. Keep new-teacher and Accountant workflows unchanged.
5. **Status and messages:** reuse Stage 1 labels and match targeted invitations by record ID, including records without saved emails. Retain email matching for legacy invitations. Refresh after sending and on window focus/return after acceptance. Show Account linked only from the persisted account link.

## Database addition for review — not applied

An exact target must persist through acceptance. Reusing assignment JSON would mix identity with assignment data and provide no referential integrity.

Proposed additive schema:

```sql
ALTER TABLE public.user_invites
  ADD COLUMN target_teacher_id uuid NULL,
  ADD COLUMN target_teacher_updated_at timestamptz NULL;

CREATE UNIQUE INDEX school_teachers_school_record_key
  ON public.school_teachers (school_id, id);

ALTER TABLE public.user_invites
  ADD CONSTRAINT user_invites_target_teacher_school_fk
  FOREIGN KEY (school_id, target_teacher_id)
  REFERENCES public.school_teachers (school_id, id);

CREATE UNIQUE INDEX user_invites_one_pending_teacher_target
  ON public.user_invites (target_teacher_id)
  WHERE target_teacher_id IS NOT NULL AND accepted_at IS NULL;
```

- Both fields are optional; existing invitations require no backfill and remain compatible.
- The composite reference prevents cross-school targets; its supporting index adds no changes to teacher data. The pending-target index rejects concurrent invitations to the same record. Expired invitations must be resent or cancelled before replacement.
- The timestamp is captured server-side and prevents linking after the selected record changes. Cancel and reselect after administrative review rather than silently accepting a changed identity.
- The migration also adds targeted-invitation validation and narrowly scoped server-only operations for issuing and completing targeted invitations. They lock the target/invitation and serialize conflicting email/account attempts, recheck exact school-admin membership and school access, and reject duplicate accounts, changed targets, expired/used invitations and cross-school attempts.
- Completion updates only account-link/email/login fields, inserts the existing Teacher role and marks acceptance in one transaction. No assignment writes occur on this path.
- Privileged operations revoke execution from public, anonymous and authenticated clients; grant execution only to the server service role. Verified identities are passed by the authenticated server handler, never accepted directly from browser-supplied school/user IDs.
- Validation must also cover direct invitation writes without weakening existing RLS. Existing table privileges stay unchanged; no broader access grants.
- Resending a targeted invitation revalidates its target and conditionally updates an invitation still pending. It cannot silently refresh a stale identity snapshot.

Approval covers this additive target storage, validation and atomic completion design; no migration has been applied.

## Verification

- Focused tests: eligibility/school/role checks, missing email, target-based pending/expired status, duplicate invitations, changed/already-linked targets, acceptance replay/failure and unchanged IDs/HR/assignments.
- Run relevant teacher/invitation/status tests and inspect automatic type-check/build results.
- Signed-in Preview: select a real HR-only record, verify read-only prefill and back/cancel, valid email entry, server-confirmed pending status without premature linking, refreshed Users list and cross-school denial.
- End-to-end acceptance: use a controlled test record and safe non-delivering test setup when available, confirm the original record reads back linked and HR/IDs/assignments/timetable data remain unchanged; clean up only test-created data. If safe account-creation verification is unavailable, explicitly report acceptance as unverified, not completed.
- Report exact files/database changes, actual checks and limitations. Stage 2 only: no import enhancements, eligibility, billing or timetable-engine changes.

**Awaiting your approval before the database addition and Stage 2 implementation.**
