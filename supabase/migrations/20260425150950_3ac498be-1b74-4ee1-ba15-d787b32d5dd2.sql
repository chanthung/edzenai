CREATE TABLE public.school_reminder_settings (
  school_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  send_hour_ist int NOT NULL DEFAULT 8 CHECK (send_hour_ist BETWEEN 0 AND 23),
  offsets_enabled jsonb NOT NULL DEFAULT '{"before_7d":true,"before_3d":true,"on":true,"after_1d":true,"after_7d":true}'::jsonb,
  templates jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.school_reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their school reminder settings"
ON public.school_reminder_settings
FOR ALL
TO authenticated
USING (school_id IN (SELECT get_user_school_ids()))
WITH CHECK (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Service role manages reminder settings"
ON public.school_reminder_settings
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_school_reminder_settings_updated_at
BEFORE UPDATE ON public.school_reminder_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.school_reminder_settings (school_id)
SELECT id FROM public.schools
ON CONFLICT (school_id) DO NOTHING;