# Stage 2 — Final Migration Review (review only, NOT EXECUTED)

Nothing has been applied, deployed or changed. Approving this plan approves the SQL below and the Stage 2 implementation described here.

## 1. Live schema and source findings (checked this session)

- Teacher record key: `school_teachers.id`. Account link: nullable `user_id`. Email nullable. Unique `(user_id, school_id)`; school-scoped case-insensitive Employee ID unique index.
- Triggers on `school_teachers`: Employee ID assignment (insert), Employee ID lock (update), `updated_at`. On `user_invites`: `updated_at` only. No database-level invitation acceptance or claiming exists.
- Foreign keys into `school_teachers`: subject assignments, class assignments, teacher availability (all cascade on delete), timetable entries (set null). Nothing references invitations.
- Effective privileges (checked with `has_table_privilege` and table ACLs): anon, authenticated and service_role all hold SELECT/INSERT/UPDATE/DELETE on `school_teachers`, `user_invites`, `user_roles`. RLS is enabled on all three, so policies decide access.
- `user_invites` policies: school admins ALL for their school (authenticated); service role ALL; and **"Public can view valid pending invite by token"** — SELECT for anon and authenticated with condition `accepted_at IS NULL AND expires_at > now()`.
- Existing acceptance is not atomic: account, role, teacher row, assignments and acceptance are separate writes, with fallback that inserts a new teacher if no unique Employee ID or name match.

## 2. Public invitation policy — plain-language explanation

- **What it allows today:** despite its name, it does not check a token. Anyone with the public app key can list every unexpired, unaccepted invitation across all schools, including the invitation token (which works like a password to activate the account), email, phone, name, role and school. The token appears in no filter. This was confirmed from the policy text and grants; no rows were fetched to prove it.
- **Who depends on it:** nothing found. The accept page validates and accepts only through the server endpoint (which reads with server access after matching the exact token). Resend runs on the server after verifying the administrator and school. The Users page list/status and Cancel use the school-admin policy, which stays.
- **Recommendation:** remove only this policy. It narrows access; no grants are widened; admin and server policies stay unchanged. Invitation acceptance after removal will be tested explicitly.

## 3. Database changes explained

- `target_teacher_id`: the exact existing teacher an invitation links to. Empty for all existing and new-teacher/Accountant invitations, so no backfill.
- `target_teacher_email`: the teacher's saved email at sending time (or empty). Used only to detect a conflicting identity; HR edits never invalidate an invitation.
- Composite school+teacher foreign key: a targeted invitation can only point to a teacher in the same school. Checked at statement end, so whole-school deletion still works. While a pending invitation exists the teacher cannot be deleted or moved to another school; cancel first.
- One-outstanding index: at most one unaccepted targeted invitation per teacher (expired ones count until cancelled or resent).
- Check: targeted invitations are always Teacher role with no assignments.
- Validation trigger: protects direct writes; targeted rows require server role, valid email, authorized and unrestricted school, eligible unlinked teacher, matching saved email, no conflicting pending invite/account; identity fields are immutable afterwards.
- Server-only operations: issue, resend and complete. Each checks server role, the verified administrator's school membership, locks email, teacher and invitation in a fixed order, and re-reads state under lock.
- Terminal-invite cleanup trigger: on teacher deletion, removes only that teacher's expired or accepted targeted invitations so they never keep a teacher undeletable; pending ones still block. Never deletes teachers or assignments itself.
- Execution: all new functions revoked from PUBLIC, anon, authenticated; only service_role may execute the operations. All use an empty search path with qualified names.

## 4. Complete proposed SQL (NOT EXECUTED)

```sql
ALTER TABLE public.user_invites
  ADD COLUMN target_teacher_id uuid NULL,
  ADD COLUMN target_teacher_email text NULL;

CREATE UNIQUE INDEX school_teachers_school_record_key
  ON public.school_teachers (school_id, id);
ALTER TABLE public.user_invites
  ADD CONSTRAINT user_invites_target_teacher_school_fk
  FOREIGN KEY (school_id, target_teacher_id)
  REFERENCES public.school_teachers (school_id, id) ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE UNIQUE INDEX user_invites_one_pending_teacher_target
  ON public.user_invites (target_teacher_id)
  WHERE target_teacher_id IS NOT NULL AND accepted_at IS NULL;
ALTER TABLE public.user_invites
  ADD CONSTRAINT user_invites_teacher_target_role
  CHECK (target_teacher_id IS NULL OR (role = 'teacher' AND assignments = '[]'::jsonb));

DROP POLICY "Public can view valid pending invite by token" ON public.user_invites;

CREATE FUNCTION public.teacher_link_email(_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$ SELECT nullif(pg_catalog.lower(pg_catalog.btrim(_email)), '') $$;
REVOKE ALL ON FUNCTION public.teacher_link_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_link_email(text) TO service_role;

CREATE FUNCTION public.validate_teacher_link_invite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE t public.school_teachers%ROWTYPE; e text; is_target boolean;
BEGIN
  e := public.teacher_link_email(NEW.email);
  IF TG_OP = 'UPDATE' AND OLD.target_teacher_id IS NOT NULL THEN
    IF NEW.target_teacher_id IS DISTINCT FROM OLD.target_teacher_id
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.invited_by IS DISTINCT FROM OLD.invited_by
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.assignments IS DISTINCT FROM OLD.assignments
       OR NEW.target_teacher_email IS DISTINCT FROM OLD.target_teacher_email THEN
      RAISE EXCEPTION 'Targeted invitation identity is immutable; cancel and create a new invitation';
    END IF;
    IF OLD.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'Invitation already accepted'; END IF;
  END IF;
  is_target := NEW.target_teacher_id IS NOT NULL;
  IF NOT is_target AND NEW.accepted_at IS NOT NULL THEN RETURN NEW; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('teacher-link-email:' || coalesce(e, ''), 0));
  IF EXISTS (SELECT 1 FROM public.user_invites i
     WHERE i.id <> NEW.id AND i.accepted_at IS NULL
       AND public.teacher_link_email(i.email) = e
       AND (is_target OR i.target_teacher_id IS NOT NULL)) THEN
    RAISE EXCEPTION 'Conflicting invitation already exists; cancel or resend it';
  END IF;
  IF NOT is_target THEN RETURN NEW; END IF;
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Targeted invitations require the authorized server' USING ERRCODE = '42501';
  END IF;
  IF e IS NULL OR e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(e) > 254 THEN
    RAISE EXCEPTION 'Valid invitation email required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.school_admins a WHERE a.user_id = NEW.invited_by AND a.school_id = NEW.school_id)
     OR public.is_school_access_blocked(NEW.school_id)
     OR public.is_school_restricted(NEW.school_id) THEN
    RAISE EXCEPTION 'School administrator authorization required' USING ERRCODE = '42501';
  END IF;
  IF NEW.role <> 'teacher' OR NEW.assignments <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Targeted invitations cannot change roles or assignments';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.accepted_at IS NOT NULL THEN RETURN NEW; END IF;
  SELECT * INTO t FROM public.school_teachers WHERE id = NEW.target_teacher_id FOR UPDATE;
  IF NOT FOUND OR t.school_id <> NEW.school_id OR t.role <> 'teacher' OR t.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Teacher is unavailable or already linked; refresh and review';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'New targeted invitation must be pending'; END IF;
    IF public.teacher_link_email(t.email) IS NOT NULL AND public.teacher_link_email(t.email) IS DISTINCT FROM e THEN
      RAISE EXCEPTION 'Invitation must use the teacher email on file; review identity before inviting';
    END IF;
    NEW.target_teacher_email := public.teacher_link_email(t.email);
    NEW.name := t.name;
    NEW.employee_id := t.employee_id;
  ELSIF public.teacher_link_email(t.email) IS DISTINCT FROM NEW.target_teacher_email
        AND public.teacher_link_email(t.email) IS DISTINCT FROM e THEN
    RAISE EXCEPTION 'Teacher invitation email changed; cancel and review';
  END IF;
  IF EXISTS (SELECT 1 FROM public.school_teachers s WHERE s.id <> t.id AND public.teacher_link_email(s.email) = e)
     OR EXISTS (SELECT 1 FROM auth.users u WHERE public.teacher_link_email(u.email) = e) THEN
    RAISE EXCEPTION 'Email is already associated with another record or account';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validate_teacher_link_invite() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_teacher_link_invite
BEFORE INSERT OR UPDATE ON public.user_invites
FOR EACH ROW EXECUTE FUNCTION public.validate_teacher_link_invite();

CREATE FUNCTION public.issue_teacher_link_invite(
  _actor uuid, _teacher uuid, _email text,
  _delivery public.invite_delivery_method DEFAULT 'email', _phone text DEFAULT NULL)
RETURNS TABLE (invite_id uuid, invite_token uuid, invite_expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE t public.school_teachers%ROWTYPE; e text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server only' USING ERRCODE = '42501'; END IF;
  e := public.teacher_link_email(_email);
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('teacher-link-email:' || coalesce(e, ''), 0));
  SELECT * INTO t FROM public.school_teachers WHERE id = _teacher FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.school_admins a WHERE a.user_id = _actor AND a.school_id = t.school_id) THEN
    RAISE EXCEPTION 'Teacher not authorized' USING ERRCODE = '42501';
  END IF;
  IF t.user_id IS NOT NULL OR t.role <> 'teacher' THEN
    RAISE EXCEPTION 'Teacher already linked or ineligible; refresh the list';
  END IF;
  IF _delivery IN ('whatsapp','both') AND coalesce(pg_catalog.btrim(_phone), '') = '' THEN
    RAISE EXCEPTION 'Phone required for WhatsApp';
  END IF;
  RETURN QUERY INSERT INTO public.user_invites AS i
    (school_id, invited_by, target_teacher_id, email, name, role, employee_id, assignments, delivery_method, phone)
    VALUES (t.school_id, _actor, t.id, e, t.name, 'teacher', t.employee_id, '[]'::jsonb, _delivery, _phone)
    RETURNING i.id, i.token, i.expires_at;
END $$;
REVOKE ALL ON FUNCTION public.issue_teacher_link_invite(uuid,uuid,text,public.invite_delivery_method,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_teacher_link_invite(uuid,uuid,text,public.invite_delivery_method,text) TO service_role;

CREATE FUNCTION public.resend_teacher_link_invite(_actor uuid, _invite uuid)
RETURNS TABLE (invite_token uuid, invite_expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE i public.user_invites%ROWTYPE; t public.school_teachers%ROWTYPE; e text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server only' USING ERRCODE = '42501'; END IF;
  SELECT * INTO i FROM public.user_invites WHERE id = _invite;
  IF NOT FOUND OR i.target_teacher_id IS NULL THEN RAISE EXCEPTION 'Invalid targeted invitation'; END IF;
  e := public.teacher_link_email(i.email);
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('teacher-link-email:' || e, 0));
  SELECT * INTO t FROM public.school_teachers WHERE id = i.target_teacher_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher record unavailable'; END IF;
  SELECT * INTO i FROM public.user_invites WHERE id = _invite FOR UPDATE;
  IF NOT FOUND OR i.target_teacher_id IS DISTINCT FROM t.id OR i.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invitation cancelled or already accepted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.school_admins a WHERE a.user_id = _actor AND a.school_id = i.school_id) THEN
    RAISE EXCEPTION 'Invitation not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY UPDATE public.user_invites AS v
    SET token = pg_catalog.gen_random_uuid(),
        expires_at = pg_catalog.clock_timestamp() + interval '7 days',
        last_sent_at = pg_catalog.clock_timestamp()
    WHERE v.id = i.id AND v.accepted_at IS NULL
    RETURNING v.token, v.expires_at;
END $$;
REVOKE ALL ON FUNCTION public.resend_teacher_link_invite(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resend_teacher_link_invite(uuid,uuid) TO service_role;

CREATE FUNCTION public.complete_teacher_link_invite(_token uuid, _account uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE i public.user_invites%ROWTYPE; t public.school_teachers%ROWTYPE; e text;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Server only' USING ERRCODE = '42501'; END IF;
  SELECT * INTO i FROM public.user_invites WHERE token = _token;
  IF NOT FOUND OR i.target_teacher_id IS NULL THEN RAISE EXCEPTION 'Invalid targeted invitation'; END IF;
  e := public.teacher_link_email(i.email);
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('teacher-link-email:' || e, 0));
  SELECT * INTO t FROM public.school_teachers WHERE id = i.target_teacher_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher record unavailable'; END IF;
  SELECT * INTO i FROM public.user_invites WHERE token = _token FOR UPDATE;
  IF NOT FOUND OR i.accepted_at IS NOT NULL OR i.expires_at <= pg_catalog.clock_timestamp() THEN
    RAISE EXCEPTION 'Invitation cancelled, expired or already accepted';
  END IF;
  IF i.target_teacher_id <> t.id OR t.school_id <> i.school_id OR t.user_id IS NOT NULL OR t.role <> 'teacher'
     OR i.role <> 'teacher' OR i.assignments <> '[]'::jsonb THEN
    RAISE EXCEPTION 'Teacher record is no longer eligible; contact the administrator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.school_admins a WHERE a.user_id = i.invited_by AND a.school_id = i.school_id)
     OR public.is_school_access_blocked(i.school_id) OR public.is_school_restricted(i.school_id) THEN
    RAISE EXCEPTION 'School access is unavailable' USING ERRCODE = '42501';
  END IF;
  IF public.teacher_link_email(t.email) IS DISTINCT FROM i.target_teacher_email
     AND public.teacher_link_email(t.email) IS DISTINCT FROM e THEN
    RAISE EXCEPTION 'Teacher invitation email changed; administrator must review';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = _account
       AND public.teacher_link_email(u.email) = e AND u.email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Verified invitation account required';
  END IF;
  IF EXISTS (SELECT 1 FROM public.school_teachers s WHERE s.user_id = _account OR (s.id <> t.id AND public.teacher_link_email(s.email) = e))
     OR EXISTS (SELECT 1 FROM public.school_admins a WHERE a.user_id = _account)
     OR EXISTS (SELECT 1 FROM public.partners p WHERE p.user_id = _account)
     OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = _account)
     OR EXISTS (SELECT 1 FROM public.user_invites j WHERE j.id <> i.id AND j.accepted_at IS NULL AND public.teacher_link_email(j.email) = e) THEN
    RAISE EXCEPTION 'Account or email already associated elsewhere';
  END IF;
  UPDATE public.school_teachers SET user_id = _account, email = e, is_active = true
    WHERE id = t.id AND school_id = i.school_id AND user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teacher already linked'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_account, 'teacher');
  UPDATE public.user_invites SET accepted_at = pg_catalog.clock_timestamp()
    WHERE id = i.id AND token = _token AND accepted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation no longer pending'; END IF;
  RETURN t.id;
END $$;
REVOKE ALL ON FUNCTION public.complete_teacher_link_invite(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_teacher_link_invite(uuid,uuid) TO service_role;

CREATE FUNCTION public.cleanup_terminal_teacher_link_invites()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role'
     AND NOT EXISTS (SELECT 1 FROM public.get_user_school_ids() AS s(school_id) WHERE s.school_id = OLD.school_id) THEN
    RAISE EXCEPTION 'Teacher deletion not authorized' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_invites
   WHERE target_teacher_id = OLD.id AND school_id = OLD.school_id
     AND (accepted_at IS NOT NULL OR expires_at <= pg_catalog.clock_timestamp());
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.cleanup_terminal_teacher_link_invites() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER cleanup_terminal_teacher_link_invites
BEFORE DELETE ON public.school_teachers
FOR EACH ROW EXECUTE FUNCTION public.cleanup_terminal_teacher_link_invites();

COMMENT ON COLUMN public.user_invites.target_teacher_email IS
  'Server-captured normalized teacher email at issuance; NULL means none. Unrelated HR edits do not invalidate the invite.';
```

The migration tool wraps this in one transaction; on any error nothing is applied.

## 5. Corrections since v2

- Foreign key changed from immediate RESTRICT to NO ACTION so deleting a whole school still cascades cleanly.
- Added the terminal-invite cleanup trigger so expired/accepted targeted invites never block teacher deletion forever.
- Recipient bound to the teacher's saved email when one exists (found by independent review).
- Removed a redundant school-exists check covered by the foreign key.

## 6. Risks and assumptions

- Account creation in the sign-in service cannot share the database transaction. If completion fails, the server deletes the new account; if that cleanup also fails it is logged and the request reports failure, never success.
- The validation trigger adds an email lock to all invitation writes; legacy flows keep their behavior but will now be rejected if they collide with a pending targeted invite for the same email.
- Legacy create/accept races are not fixed by this stage.
- SQL has been reviewed by reading only; it has not been executed or syntax-tested against the database.
- Note: the earlier v2 file in Files lacks the corrections above. This plan holds the current version.

## 7. Implementation after approval

- Add User → Teacher: "Invite a new teacher" (unchanged) or "Link an existing teacher": search unlinked current-school teachers by name/Employee ID, show Employee ID and key HR details, lock name/ID, prefill or enter email, no assignment controls, back action.
- create/resend/accept functions: route targeted invitations to the three server operations; legacy path unchanged. Never insert a new teacher for a targeted invite.
- Status: match targeted invites by teacher record; keep email matching for legacy. Refresh after send and on window focus.
- Delete teacher shows "Cancel the pending invitation first" when blocked.

## 8. Test plan

Existing (rerun): account status, invite compatibility, HR save, HR validation, import, downloads, toast, field help — full suite.

New focused tests: missing-email teacher; valid targeted invite shows pending; email conflict; duplicate invite rejected; expired/cancelled/reused/replayed token rejected; deleted/moved/already-linked target rejected; cross-school denial; concurrent send and accept (one winner); rollback when any completion step fails; no new teacher row; Employee ID, HR, assignments, year scopes and timetable rows unchanged; new-teacher and Accountant regressions; anonymous direct invitation listing denied; acceptance works after policy removal; terminal-invite cleanup allows deleting an assignment-free test teacher while a pending one blocks it.

Live checks: direct anonymous/authenticated calls to the server-only operations rejected; signed-in Preview walk-through. End-to-end acceptance only with a controlled test record and safe test setup; otherwise reported as not verified.

## 9. Recovery

The migration is all-or-nothing. If a defect appears afterwards: stop using targeted invitations in the app, drop the new triggers and functions in a follow-up change, leave the two new columns unused (marked deprecated). Restoring the public policy is not recommended because of the exposure described above.
