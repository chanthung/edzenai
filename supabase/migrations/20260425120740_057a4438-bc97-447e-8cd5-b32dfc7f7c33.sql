
-- Promotion rules per school/board/class-range
CREATE TABLE public.promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  board TEXT NOT NULL DEFAULT 'CBSE',
  class_range TEXT NOT NULL,
  min_subject_pct NUMERIC NOT NULL DEFAULT 35,
  min_theory_pct NUMERIC,
  min_practical_pct NUMERIC,
  min_internal_pct NUMERIC,
  english_compulsory BOOLEAN NOT NULL DEFAULT true,
  grace_marks INTEGER NOT NULL DEFAULT 0,
  max_compartment_subjects INTEGER NOT NULL DEFAULT 1,
  best_of_n INTEGER,
  is_board_exit BOOLEAN NOT NULL DEFAULT false,
  attendance_threshold NUMERIC,
  custom_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, board, class_range)
);

ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promotion rules" ON public.promotion_rules
  FOR ALL TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Teachers view promotion rules" ON public.promotion_rules
  FOR SELECT
  USING (school_id IN (SELECT get_teacher_school_ids()));

CREATE TRIGGER promotion_rules_updated_at
  BEFORE UPDATE ON public.promotion_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Promotion run audit
CREATE TABLE public.promotion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  from_year_id UUID NOT NULL,
  to_year_id UUID NOT NULL,
  initiated_by UUID,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  rules_snapshot JSONB,
  consent JSONB,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promotion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promotion runs" ON public.promotion_runs
  FOR ALL TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT get_user_school_ids()));

-- Per-student outcomes
CREATE TABLE public.promotion_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.promotion_runs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  from_class TEXT,
  from_section TEXT,
  to_class TEXT,
  to_section TEXT,
  final_pct NUMERIC,
  failing_subjects JSONB DEFAULT '[]'::jsonb,
  auto_status TEXT,
  status TEXT NOT NULL,
  override_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotion_outcomes_run ON public.promotion_outcomes(run_id);
CREATE INDEX idx_promotion_outcomes_student ON public.promotion_outcomes(student_id);

ALTER TABLE public.promotion_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promotion outcomes" ON public.promotion_outcomes
  FOR ALL TO authenticated
  USING (run_id IN (SELECT id FROM public.promotion_runs WHERE school_id IN (SELECT get_user_school_ids())))
  WITH CHECK (run_id IN (SELECT id FROM public.promotion_runs WHERE school_id IN (SELECT get_user_school_ids())));
