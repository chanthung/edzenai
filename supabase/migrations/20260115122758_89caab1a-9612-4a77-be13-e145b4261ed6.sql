-- Create an atomic, secure onboarding function to create a school + primary admin + default fee categories
-- This avoids client-side multi-step writes that can fail under RLS timing and also reduces race conditions.

CREATE OR REPLACE FUNCTION public.create_school_with_primary_admin(
  _school_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.schools (name)
  VALUES (_school_name)
  RETURNING id INTO v_school_id;

  INSERT INTO public.school_admins (user_id, school_id, is_primary)
  VALUES (auth.uid(), v_school_id, true);

  INSERT INTO public.fee_categories (school_id, name, description, is_mandatory, display_order)
  VALUES
    (v_school_id, 'Tuition Fee', 'Annual tuition fees', true, 1),
    (v_school_id, 'Transport Fee', 'School bus/transport charges', false, 2),
    (v_school_id, 'Activities Fee', 'Sports, arts, and extracurricular activities', false, 3);

  RETURN v_school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_school_with_primary_admin(text) TO authenticated;