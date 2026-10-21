# Stage 2: Link Existing HR-Only Teachers

## Inspection findings

- The stable teacher-record key is `school_teachers.id`; the login-account link is `school_teachers.user_id`.
- Invitations have no explicit teacher-record target. Acceptance guesses by Employee ID/name and may insert another record if the intended record changes.
- Linking, assigning the existing role and marking acceptance currently use separate writes. The targeted path needs atomic completion to prevent partial or duplicate links.
- Existing teacher self-access requires `user_id = auth.uid()`; NULL cannot grant access. School-scoped RLS and Employee ID generation/locking remain unchanged.
- Employee IDs are school-unique; account IDs are unique within a school. Outstanding invitations have no target uniqueness protection. Effective catalog checks confirm anon/authenticated/service_role have table CRUD privileges, constrained by enabled RLS.
- Security finding: the public pending-invitation SELECT policy does not require a token and can expose pending invitation credentials. Its removal is proposed for explicit review; admin/server policies and grants remain intact. Public acceptance already reads through the token-validated server GET endpoint.
- Final access review: AcceptInvite uses only server GET/POST for invitation validation/acceptance, not direct invitation-table reads. Resend validates JWT and exact school membership server-side. Users status/list and cancellation use authenticated table SELECT/DELETE; the retained school-admin ALL policy covers both, and existing effective SELECT/DELETE privileges were confirmed. These findings establish compatibility by source/catalog inspection; post-migration browser/RLS tests will verify runtime behavior.

## What changes after approval

1. **Add User — Teacher only:** keep “Invite a new teacher” and add “Link an existing teacher.” Search current-school, unlinked Teacher records by name or Employee ID; identify missing email addresses. Selecting a record locks its name and Employee ID and prefills email when available. Allow a valid invitation email and a back action. Do not show assignment-editing controls for this path.
2. **Send invitation:** authenticate the administrator and resolve their school on the server. Validate the exact target, email/account conflicts and outstanding invitations. Store the target without linking an account or changing the teacher. Reject duplicate targeted invitations; use existing Cancel/Resend instead of silently replacing them.
3. **Accept invitation:** reuse the existing account-creation and invitation-verification experience. Recheck the exact record and reject deletion, school/role changes, an existing account link or conflicting email identity—not unrelated HR edits. Atomically link the verified account, add its existing Teacher role to the protected role table and consume the invitation. Never fall back to inserting a teacher. Remove the newly created account if completion fails; report cleanup failures rather than claiming success.
4. **Preserve data:** update only account-link/email fields and login access needed to activate the accepted account. Preserve Employee ID, name, teacher role, HR details, assignments, academic-year scopes and all timetable records. Keep new-teacher and Accountant workflows unchanged.
5. **Status and messages:** reuse Stage 1 labels and match targeted invitations by record ID, including records without saved emails. Retain email matching for legacy invitations. Refresh after sending and on window focus/return after acceptance. Show Account linked only from the persisted account link.

## Database addition for review — not applied

An exact target must persist through acceptance. Reusing assignment JSON would mix identity with assignment data and provide no referential integrity.

Proposed additive schema:

```sql
ALTER TABLE public.user_invites
  ADD COLUMN target_teacher_id uuid NULL,
  ADD COLUMN target_teacher_email text NULL;

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
- Capture only the normalized email server-side. If an email exists, issuance must use it; blank-email records allow a valid new recipient. Acceptance/resend permits the original saved email or the invitation email, but rejects any third identity. Designation, department, experience, qualification and other HR edits never invalidate the invitation.
- The migration also adds targeted-invitation validation and narrowly scoped server-only operations for issuing and completing targeted invitations. They lock the target/invitation and serialize conflicting email/account attempts, recheck exact school-admin membership and school access, and reject duplicate accounts, changed targets, expired/used invitations and cross-school attempts.
- Completion updates only account-link/email/login fields, inserts the existing Teacher role and marks acceptance in one transaction. No assignment writes occur on this path.
- Privileged operations revoke execution from public, anonymous and authenticated clients; grant execution only to the server service role. Verified identities are passed by the authenticated server handler, never accepted directly from browser-supplied school/user IDs.
- Validation also covers direct invitation writes. Existing table privileges stay unchanged; no broader grants. Remove only the unsafe public-pending SELECT policy, subject to approval, retaining school-admin/server access. This narrows access and is the only proposed RLS policy change.
- Resend uses a service-only operation preserving the exact target and snapshot with email → teacher → invitation locks and revalidation. Cancelled/expired tokens cannot complete; resend rotates the token of a still-pending invite. Unique pending-target indexing plus serialized email checks prevent duplicate targeted sends; completion locks permit only one link/acceptance winner. Legacy races are not claimed fixed.
- Complete review-only SQL, including validation, issuance, resend, completion, execution revocations and the proposed public-policy removal, is supplied in `EdZenAI-Stage2-Proposed-Migration_v2.sql` in Files. No SQL has been executed. The composite reference restricts deleting/moving a targeted teacher while referenced invitations exist; it never cascades teacher/assignment deletion.
- The v2 SQL's permanent reference restriction is superseded by the terminal-invitation cleanup below. Include it in the final migration; do not apply v2 alone.

### Cancelled, expired and completed target references

- Cancel uses the existing authorized invitation DELETE. The row and token cease to exist, freeing the target's pending-invitation slot. Acceptance/resend must re-read after locking, so cancellation cannot race into a later link; if completion wins first, cancellation must not be reported as undoing that account link.
- Expiry alone does not erase the target or turn it into a legacy invitation. Keep the expired row so the existing expired status and Resend/Cancel actions continue working. It cannot be accepted; its uniqueness slot remains occupied until cancellation or exact-target resend. A fresh send cannot create a second outstanding invitation.
- Before an authorized teacher deletion, remove only that teacher's expired-unaccepted and already-accepted targeted invitation rows. Leave live pending rows protected by the foreign key and return a clear “Cancel the pending invitation first” message. Cancel is available immediately; expired/accepted references do not keep a teacher undeletable forever.
- Cleanup never deletes a teacher or assignment itself, never changes Employee IDs/HR/timetable data, and never nulls a target into the legacy fallback path. A caller's teacher DELETE remains subject to existing RLS. Ordinary deletion's pre-existing assignment behavior is not broadened or changed.
- Serialize/recheck cleanup and completion; a locking conflict fails safely for retry rather than reporting partial success. No background cleanup job, new retention policy or cascading teacher delete is added.

Additional final migration SQL:

```sql
CREATE FUNCTION public.cleanup_terminal_teacher_link_invites()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND NOT EXISTS (
       SELECT 1 FROM public.get_user_school_ids() AS s(school_id)
       WHERE s.school_id = OLD.school_id
     ) THEN
    RAISE EXCEPTION 'Teacher deletion not authorized'
      USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_invites
  WHERE target_teacher_id = OLD.id
    AND school_id = OLD.school_id
    AND (accepted_at IS NOT NULL
         OR expires_at <= pg_catalog.clock_timestamp());
  -- Any live pending reference still blocks DELETE via the composite FK.
  -- If DELETE is blocked, this transaction rolls back the cleanup too.
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.cleanup_terminal_teacher_link_invites()
  FROM PUBLIC, anon, authenticated;
CREATE TRIGGER cleanup_terminal_teacher_link_invites
BEFORE DELETE ON public.school_teachers
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_terminal_teacher_link_invites();
```

Approval covers this additive target storage, validation and atomic completion design; no migration has been applied.

## Verification

- Focused tests: eligibility/school/role checks, missing email, target-based pending/expired status, duplicate invitations, changed/already-linked targets, acceptance replay/failure and unchanged IDs/HR/assignments.
- Final requested tests: anonymous invitation-list denial; token-based public GET/POST; authorized admin resend/cancel/status; cross-school denial without broader grants; cancelled/expired token rejection; duplicate pending targets; expired/accepted-only reference cleanup allowing deletion of an assignment-free controlled test teacher; live pending reference blocking deletion; cancel/accept/resend races and rollback. Verify no cascades or writes to unrelated records.
- Run relevant teacher/invitation/status tests and inspect automatic type-check/build results.
- Pre-approval checks completed: live schema/index/constraint/trigger/RLS/effective privilege reads and invitation-flow source audit; 21 existing tests passed across four files. Latest available build log is OK. Proposed functions, concurrency, Preview linking and end-to-end acceptance have not been executed or verified.
- Signed-in Preview: select a real HR-only record, verify read-only prefill and back/cancel, valid email entry, server-confirmed pending status without premature linking, refreshed Users list and cross-school denial.
- End-to-end acceptance: use a controlled test record and safe non-delivering test setup when available, confirm the original record reads back linked and HR/IDs/assignments/timetable data remain unchanged; clean up only test-created data. If safe account-creation verification is unavailable, explicitly report acceptance as unverified, not completed.
- Report exact files/database changes, actual checks and limitations. Stage 2 only: no import enhancements, eligibility, billing or timetable-engine changes.

**Your conditional approval is incorporated. In the current plan-review mode, approve this final revision to proceed with the minimal migration and Stage 2 implementation; no migration or linking change has yet been applied.**
