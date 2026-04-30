ALTER TABLE public.import_logs
  ADD COLUMN IF NOT EXISTS import_type text NOT NULL DEFAULT 'students';

CREATE INDEX IF NOT EXISTS idx_import_logs_school_type_imported_at
  ON public.import_logs (school_id, import_type, imported_at DESC);