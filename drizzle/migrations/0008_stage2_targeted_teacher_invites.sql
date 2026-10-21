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