
CREATE TABLE public.fee_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  installment_id uuid NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (student_id, installment_id, reminder_type)
);

ALTER TABLE public.fee_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage fee reminder logs"
  ON public.fee_reminder_logs
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can view fee reminder logs"
  ON public.fee_reminder_logs
  FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM public.students WHERE school_id IN (SELECT get_user_school_ids())
  ));
