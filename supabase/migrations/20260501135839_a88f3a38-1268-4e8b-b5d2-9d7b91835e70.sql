ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_preferred_language_chk;
ALTER TABLE public.students
  ADD CONSTRAINT students_preferred_language_chk
  CHECK (preferred_language IS NULL OR preferred_language IN ('en','hi','as','bn','ta','kn','mr'));