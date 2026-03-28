
CREATE TABLE public.volume_discount_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_students integer NOT NULL,
  max_students integer,
  discount_percent numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volume_discount_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage volume discount tiers"
  ON public.volume_discount_tiers FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Public can view volume discount tiers"
  ON public.volume_discount_tiers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can view volume discount tiers"
  ON public.volume_discount_tiers FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.volume_discount_tiers (min_students, max_students, discount_percent)
VALUES (500, 999, 5), (1000, NULL, 10);
