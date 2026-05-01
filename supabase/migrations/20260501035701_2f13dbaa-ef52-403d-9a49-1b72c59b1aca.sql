ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS preferred_language text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'students_preferred_language_chk'
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_preferred_language_chk
      CHECK (preferred_language IS NULL OR preferred_language IN ('en','hi','as','bn'));
  END IF;
END $$;