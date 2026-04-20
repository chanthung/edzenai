
-- 1. Phone normalization function
CREATE OR REPLACE FUNCTION public.normalize_indian_phone(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  digits text;
BEGIN
  IF raw IS NULL THEN RETURN NULL; END IF;
  digits := regexp_replace(raw, '\D', '', 'g');
  IF digits = '' THEN RETURN NULL; END IF;
  -- Strip country code 91 if total length 12
  IF length(digits) = 12 AND left(digits, 2) = '91' THEN
    digits := substring(digits from 3);
  END IF;
  -- Strip leading 0 if length 11
  IF length(digits) = 11 AND left(digits, 1) = '0' THEN
    digits := substring(digits from 2);
  END IF;
  RETURN digits;
END;
$$;

-- 2. Trigger function
CREATE OR REPLACE FUNCTION public.trigger_normalize_parent_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.parent_phone := public.normalize_indian_phone(NEW.parent_phone);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_normalize_parent_phone ON public.students;
CREATE TRIGGER students_normalize_parent_phone
  BEFORE INSERT OR UPDATE OF parent_phone ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_normalize_parent_phone();

-- 3. Backfill existing data
UPDATE public.students
SET parent_phone = public.normalize_indian_phone(parent_phone)
WHERE parent_phone IS NOT NULL
  AND parent_phone IS DISTINCT FROM public.normalize_indian_phone(parent_phone);

-- 4. RLS policies for parent_link_dispatches (insert/update needed for logging)
DROP POLICY IF EXISTS "Service role can manage parent link dispatches" ON public.parent_link_dispatches;
CREATE POLICY "Service role can manage parent link dispatches"
  ON public.parent_link_dispatches
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can insert parent link dispatches" ON public.parent_link_dispatches;
CREATE POLICY "Admins can insert parent link dispatches"
  ON public.parent_link_dispatches
  FOR INSERT
  TO authenticated
  WITH CHECK (school_id IN (SELECT get_user_school_ids()));

DROP POLICY IF EXISTS "Accountants can insert parent link dispatches" ON public.parent_link_dispatches;
CREATE POLICY "Accountants can insert parent link dispatches"
  ON public.parent_link_dispatches
  FOR INSERT
  TO authenticated
  WITH CHECK (school_id IN (SELECT get_accountant_school_ids()));
