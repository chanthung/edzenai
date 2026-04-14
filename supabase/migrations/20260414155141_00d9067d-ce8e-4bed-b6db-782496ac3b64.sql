
CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  ignored_columns jsonb DEFAULT '[]'::jsonb,
  issue_rows jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import logs of their schools"
  ON public.import_logs FOR ALL
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));

CREATE POLICY "Admins can view import logs of their schools"
  ON public.import_logs FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT get_user_school_ids()));
