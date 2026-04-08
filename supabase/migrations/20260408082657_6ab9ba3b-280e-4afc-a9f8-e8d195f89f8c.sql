
CREATE OR REPLACE FUNCTION public.normalize_class_name(raw_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN raw_name IS NULL THEN NULL
    WHEN trim(raw_name) ~ '^\d+$' THEN 'Class ' || trim(raw_name)
    ELSE trim(raw_name)
  END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_normalize_class_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.class_name := normalize_class_name(NEW.class_name);
  RETURN NEW;
END;
$$;
