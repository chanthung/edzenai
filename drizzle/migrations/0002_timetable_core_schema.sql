-- ============================================================
-- Timetable data model v3 (multi-tenant hardened)
-- Additive only. No existing EdZen AI table is altered.
-- ============================================================

-- ---------- shared tenant validation helpers ----------
CREATE OR REPLACE FUNCTION public.timetable_assert_year_school(_academic_year_id uuid, _school_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _academic_year_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academic_years ay WHERE ay.id = _academic_year_id AND ay.school_id = _school_id) THEN
    RAISE EXCEPTION 'tenant violation: academic_year_id % does not belong to school %', _academic_year_id, _school_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.timetable_assert_subject_school(_subject_id uuid, _school_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _subject_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = _subject_id AND s.school_id = _school_id) THEN
    RAISE EXCEPTION 'tenant violation: subject_id % does not belong to school %', _subject_id, _school_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.timetable_assert_teacher_school(_teacher_id uuid, _school_id uuid)
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _teacher_id IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.school_teachers t WHERE t.id = _teacher_id AND t.school_id = _school_id) THEN
    RAISE EXCEPTION 'tenant violation: teacher_id % does not belong to school %', _teacher_id, _school_id;
  END IF;
END;
$$;

-- ---------- transaction-scoped tenant context ----------
CREATE OR REPLACE FUNCTION public.timetable_ctx_school()
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(current_setting('timetable.school_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.timetable_ctx_year()
RETURNS uuid LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(current_setting('timetable.academic_year_id', true), '')::uuid
$$;

-- ---------- least-privilege service role ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'timetable_service') THEN
    CREATE ROLE timetable_service NOLOGIN;
  END IF;
END;
$$;

GRANT USAGE ON SCHEMA public TO timetable_service;

GRANT SELECT ON public.schools,
                public.academic_years,
                public.school_teachers,
                public.subjects,
                public.subject_class_assignments,
                public.teacher_subject_assignments,
                public.teacher_class_assignments,
                public.student_enrollments
  TO timetable_service;

GRANT EXECUTE ON FUNCTION public.timetable_ctx_school() TO timetable_service;
GRANT EXECUTE ON FUNCTION public.timetable_ctx_year() TO timetable_service;

-- ============================================================
-- 1. timetable_rooms  (year-independent, school-scoped)
-- ============================================================
CREATE TABLE public.timetable_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_type text NOT NULL DEFAULT 'classroom'
    CHECK (room_type IN ('classroom','science_lab','computer_lab','library','art','music','sports','auditorium','other')),
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, school_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_rooms TO authenticated;
GRANT ALL ON public.timetable_rooms TO service_role;
GRANT SELECT ON public.timetable_rooms TO timetable_service;
ALTER TABLE public.timetable_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_rooms_admin_all ON public.timetable_rooms
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_rooms_teacher_read ON public.timetable_rooms
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_rooms_service_read ON public.timetable_rooms
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE UNIQUE INDEX timetable_rooms_school_name_uidx ON public.timetable_rooms (school_id, lower(name));
CREATE INDEX timetable_rooms_type_idx ON public.timetable_rooms (school_id, room_type) WHERE is_active;

CREATE TRIGGER timetable_rooms_set_updated_at BEFORE UPDATE ON public.timetable_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. timetable_settings
-- ============================================================
CREATE TABLE public.timetable_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  working_days smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6]::smallint[],
  day_start_time time NOT NULL DEFAULT '08:00',
  default_period_minutes smallint NOT NULL DEFAULT 40,
  periods_per_day smallint NOT NULL DEFAULT 8,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_settings TO authenticated;
GRANT ALL ON public.timetable_settings TO service_role;
GRANT SELECT ON public.timetable_settings TO timetable_service;
ALTER TABLE public.timetable_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_settings_admin_all ON public.timetable_settings
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_settings_teacher_read ON public.timetable_settings
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_settings_service_read ON public.timetable_settings
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE UNIQUE INDEX timetable_settings_school_year_uidx ON public.timetable_settings (school_id, academic_year_id);
CREATE INDEX timetable_settings_school_idx ON public.timetable_settings (school_id);

CREATE OR REPLACE FUNCTION public.timetable_settings_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_settings_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_settings
  FOR EACH ROW EXECUTE FUNCTION public.timetable_settings_tenant_check();
CREATE TRIGGER timetable_settings_set_updated_at BEFORE UPDATE ON public.timetable_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. timetable_time_slots
-- ============================================================
CREATE TABLE public.timetable_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  period_number smallint NOT NULL CHECK (period_number > 0),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time),
  UNIQUE (id, school_id, academic_year_id),
  UNIQUE (school_id, academic_year_id, weekday, period_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_time_slots TO authenticated;
GRANT ALL ON public.timetable_time_slots TO service_role;
GRANT SELECT ON public.timetable_time_slots TO timetable_service;
ALTER TABLE public.timetable_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_time_slots_admin_all ON public.timetable_time_slots
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_time_slots_teacher_read ON public.timetable_time_slots
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_time_slots_service_read ON public.timetable_time_slots
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE INDEX timetable_time_slots_grid_idx ON public.timetable_time_slots (school_id, academic_year_id, weekday) WHERE is_active;

CREATE OR REPLACE FUNCTION public.timetable_time_slots_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_time_slots_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_time_slots
  FOR EACH ROW EXECUTE FUNCTION public.timetable_time_slots_tenant_check();
CREATE TRIGGER timetable_time_slots_set_updated_at BEFORE UPDATE ON public.timetable_time_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. timetable_breaks
-- ============================================================
CREATE TABLE public.timetable_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  weekday smallint CHECK (weekday BETWEEN 1 AND 7),
  break_type text NOT NULL DEFAULT 'short_break'
    CHECK (break_type IN ('short_break','lunch','assembly','prayer','other')),
  after_period smallint NOT NULL CHECK (after_period >= 0),
  duration_minutes smallint NOT NULL CHECK (duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_breaks TO authenticated;
GRANT ALL ON public.timetable_breaks TO service_role;
GRANT SELECT ON public.timetable_breaks TO timetable_service;
ALTER TABLE public.timetable_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_breaks_admin_all ON public.timetable_breaks
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_breaks_teacher_read ON public.timetable_breaks
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_breaks_service_read ON public.timetable_breaks
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE UNIQUE INDEX timetable_breaks_uidx ON public.timetable_breaks
  (school_id, academic_year_id, coalesce(weekday, 0), after_period, break_type);
CREATE INDEX timetable_breaks_year_idx ON public.timetable_breaks (school_id, academic_year_id);

CREATE OR REPLACE FUNCTION public.timetable_breaks_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_breaks_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_breaks
  FOR EACH ROW EXECUTE FUNCTION public.timetable_breaks_tenant_check();
CREATE TRIGGER timetable_breaks_set_updated_at BEFORE UPDATE ON public.timetable_breaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. timetable_room_requirements
-- ============================================================
CREATE TABLE public.timetable_room_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_name text,
  required_room_type text
    CHECK (required_room_type IS NULL OR required_room_type IN
      ('classroom','science_lab','computer_lab','library','art','music','sports','auditorium','other')),
  preferred_room_id uuid,
  is_mandatory boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (preferred_room_id, school_id)
    REFERENCES public.timetable_rooms(id, school_id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_room_requirements TO authenticated;
GRANT ALL ON public.timetable_room_requirements TO service_role;
GRANT SELECT ON public.timetable_room_requirements TO timetable_service;
ALTER TABLE public.timetable_room_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_room_req_admin_all ON public.timetable_room_requirements
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_room_req_teacher_read ON public.timetable_room_requirements
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_room_req_service_read ON public.timetable_room_requirements
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school());

CREATE UNIQUE INDEX timetable_room_req_uidx ON public.timetable_room_requirements
  (school_id, subject_id, coalesce(class_name,''),
   coalesce(academic_year_id,'00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX timetable_room_req_lookup_idx ON public.timetable_room_requirements (school_id, subject_id);

CREATE OR REPLACE FUNCTION public.timetable_room_req_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_subject_school(NEW.subject_id, NEW.school_id);
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_room_req_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_room_requirements
  FOR EACH ROW EXECUTE FUNCTION public.timetable_room_req_tenant_check();
CREATE TRIGGER timetable_room_req_set_updated_at BEFORE UPDATE ON public.timetable_room_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. timetable_teacher_availability
-- ============================================================
CREATE TABLE public.timetable_teacher_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.school_teachers(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, time_slot_id),
  FOREIGN KEY (time_slot_id, school_id, academic_year_id)
    REFERENCES public.timetable_time_slots(id, school_id, academic_year_id) ON DELETE CASCADE
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_teacher_availability TO authenticated;
GRANT ALL ON public.timetable_teacher_availability TO service_role;
GRANT SELECT ON public.timetable_teacher_availability TO timetable_service;
ALTER TABLE public.timetable_teacher_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_avail_admin_all ON public.timetable_teacher_availability
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_avail_own_read ON public.timetable_teacher_availability
  FOR SELECT TO authenticated
  USING (
    school_id IN (SELECT public.get_teacher_school_ids())
    AND teacher_id IN (SELECT id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active)
  );
CREATE POLICY timetable_avail_own_insert ON public.timetable_teacher_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id IN (SELECT public.get_teacher_school_ids())
    AND teacher_id IN (SELECT id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active)
  );
CREATE POLICY timetable_avail_own_update ON public.timetable_teacher_availability
  FOR UPDATE TO authenticated
  USING (teacher_id IN (SELECT id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active))
  WITH CHECK (teacher_id IN (SELECT id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active));
CREATE POLICY timetable_avail_own_delete ON public.timetable_teacher_availability
  FOR DELETE TO authenticated
  USING (teacher_id IN (SELECT id FROM public.school_teachers WHERE user_id = auth.uid() AND is_active));
CREATE POLICY timetable_avail_service_read ON public.timetable_teacher_availability
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE INDEX timetable_teacher_avail_idx ON public.timetable_teacher_availability (school_id, academic_year_id, teacher_id);

CREATE OR REPLACE FUNCTION public.timetable_avail_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_teacher_school(NEW.teacher_id, NEW.school_id);
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_avail_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_teacher_availability
  FOR EACH ROW EXECUTE FUNCTION public.timetable_avail_tenant_check();
CREATE TRIGGER timetable_avail_set_updated_at BEFORE UPDATE ON public.timetable_teacher_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- free/busy view without the private reason column
CREATE VIEW public.timetable_teacher_availability_public
WITH (security_invoker = true) AS
  SELECT school_id, academic_year_id, teacher_id, time_slot_id, is_available
  FROM public.timetable_teacher_availability;
GRANT SELECT ON public.timetable_teacher_availability_public TO authenticated;

-- ============================================================
-- 7. timetable_subject_requirements
-- ============================================================
CREATE TABLE public.timetable_subject_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  section text,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  periods_per_week smallint NOT NULL CHECK (periods_per_week > 0),
  delivery_mode text NOT NULL DEFAULT 'theory'
    CHECK (delivery_mode IN ('theory','practical','lab','activity','online')),
  elective_group text,
  consecutive_periods smallint NOT NULL DEFAULT 1 CHECK (consecutive_periods > 0),
  preferred_weekdays smallint[],
  priority smallint NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_subject_requirements TO authenticated;
GRANT ALL ON public.timetable_subject_requirements TO service_role;
GRANT SELECT ON public.timetable_subject_requirements TO timetable_service;
ALTER TABLE public.timetable_subject_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_subject_req_admin_all ON public.timetable_subject_requirements
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_subject_req_teacher_read ON public.timetable_subject_requirements
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_subject_req_service_read ON public.timetable_subject_requirements
  FOR SELECT TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE UNIQUE INDEX timetable_subject_req_uidx ON public.timetable_subject_requirements
  (school_id, academic_year_id, class_name, coalesce(section,''), subject_id, coalesce(elective_group,''));
CREATE INDEX timetable_subject_req_year_idx ON public.timetable_subject_requirements (school_id, academic_year_id);
CREATE INDEX timetable_subject_req_subject_idx ON public.timetable_subject_requirements (school_id, subject_id);

CREATE OR REPLACE FUNCTION public.timetable_subject_req_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_subject_school(NEW.subject_id, NEW.school_id);
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_subject_req_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_subject_requirements
  FOR EACH ROW EXECUTE FUNCTION public.timetable_subject_req_tenant_check();
CREATE TRIGGER timetable_subject_req_set_updated_at BEFORE UPDATE ON public.timetable_subject_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. timetable_runs
-- ============================================================
CREATE TABLE public.timetable_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','solved','infeasible','published','discarded')),
  requested_by uuid,
  solver_stats jsonb,
  constraints_snapshot jsonb,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, school_id, academic_year_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_runs TO authenticated;
GRANT ALL ON public.timetable_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_runs TO timetable_service;
ALTER TABLE public.timetable_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_runs_admin_all ON public.timetable_runs
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_runs_teacher_read ON public.timetable_runs
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_runs_service ON public.timetable_runs
  FOR ALL TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year())
  WITH CHECK (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE INDEX timetable_runs_status_idx ON public.timetable_runs (school_id, academic_year_id, status);
CREATE UNIQUE INDEX timetable_runs_one_published_uidx ON public.timetable_runs (school_id, academic_year_id)
  WHERE status = 'published';

CREATE OR REPLACE FUNCTION public.timetable_runs_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_runs_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_runs
  FOR EACH ROW EXECUTE FUNCTION public.timetable_runs_tenant_check();
CREATE TRIGGER timetable_runs_set_updated_at BEFORE UPDATE ON public.timetable_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. timetable_entries
-- ============================================================
CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  run_id uuid NOT NULL,
  class_name text NOT NULL,
  section text,
  time_slot_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.school_teachers(id) ON DELETE SET NULL,
  room_id uuid,
  elective_group text,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, school_id, academic_year_id)
    REFERENCES public.timetable_runs(id, school_id, academic_year_id) ON DELETE CASCADE,
  FOREIGN KEY (time_slot_id, school_id, academic_year_id)
    REFERENCES public.timetable_time_slots(id, school_id, academic_year_id),
  FOREIGN KEY (room_id, school_id)
    REFERENCES public.timetable_rooms(id, school_id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO timetable_service;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY timetable_entries_admin_all ON public.timetable_entries
  FOR ALL TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));
CREATE POLICY timetable_entries_teacher_read ON public.timetable_entries
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT public.get_teacher_school_ids()));
CREATE POLICY timetable_entries_service ON public.timetable_entries
  FOR ALL TO timetable_service
  USING (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year())
  WITH CHECK (school_id = public.timetable_ctx_school()
         AND academic_year_id = public.timetable_ctx_year());

CREATE UNIQUE INDEX timetable_entries_section_slot_uidx ON public.timetable_entries
  (run_id, class_name, coalesce(section,''), time_slot_id, coalesce(elective_group,''));
CREATE UNIQUE INDEX timetable_entries_teacher_slot_uidx ON public.timetable_entries
  (run_id, teacher_id, time_slot_id) WHERE teacher_id IS NOT NULL;
CREATE UNIQUE INDEX timetable_entries_room_slot_uidx ON public.timetable_entries
  (run_id, room_id, time_slot_id) WHERE room_id IS NOT NULL;
CREATE INDEX timetable_entries_run_idx ON public.timetable_entries (school_id, academic_year_id, run_id);

CREATE OR REPLACE FUNCTION public.timetable_entries_tenant_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.timetable_assert_subject_school(NEW.subject_id, NEW.school_id);
  PERFORM public.timetable_assert_teacher_school(NEW.teacher_id, NEW.school_id);
  PERFORM public.timetable_assert_year_school(NEW.academic_year_id, NEW.school_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER timetable_entries_tenant_check BEFORE INSERT OR UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.timetable_entries_tenant_check();
CREATE TRIGGER timetable_entries_set_updated_at BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
