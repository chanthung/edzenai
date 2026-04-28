-- 1. Add 'partner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- 2. Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  referral_code text NOT NULL UNIQUE,
  commission_percent numeric NOT NULL DEFAULT 20 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partners_user_id ON public.partners(user_id);
CREATE INDEX idx_partners_referral_code ON public.partners(referral_code);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. Add referred_by column to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.partners(id) ON DELETE SET NULL;
CREATE INDEX idx_schools_referred_by ON public.schools(referred_by);

-- 4. Create partner_payouts table
CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_payouts_partner_id ON public.partner_payouts(partner_id);

ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- 5. Create partner_commissions table
CREATE TABLE public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  school_id uuid NOT NULL,
  platform_payment_id uuid NOT NULL UNIQUE,
  payment_amount numeric NOT NULL,
  commission_percent numeric NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  payout_id uuid REFERENCES public.partner_payouts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_commissions_partner_id ON public.partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_school_id ON public.partner_commissions(school_id);
CREATE INDEX idx_partner_commissions_status ON public.partner_commissions(status);

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

-- 6. Helper function: is_partner
CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partners
    WHERE user_id = auth.uid() AND is_active = true
  )
$$;

-- 7. Helper function: get current partner_id
CREATE OR REPLACE FUNCTION public.get_my_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = auth.uid() LIMIT 1
$$;

-- 8. Public referral code resolver (signup uses this)
CREATE OR REPLACE FUNCTION public.resolve_referral_code(_code text)
RETURNS TABLE(id uuid, name text, referral_code text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.referral_code
  FROM public.partners p
  WHERE upper(p.referral_code) = upper(_code) AND p.is_active = true
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.resolve_referral_code(text) TO anon, authenticated;

-- 9. Trigger: auto-create commission on platform_payment insert
CREATE OR REPLACE FUNCTION public.create_partner_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _commission_pct numeric;
BEGIN
  SELECT s.referred_by INTO _partner_id
  FROM public.schools s
  WHERE s.id = NEW.school_id;

  IF _partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT commission_percent INTO _commission_pct
  FROM public.partners
  WHERE id = _partner_id AND is_active = true;

  IF _commission_pct IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.partner_commissions (
    partner_id, school_id, platform_payment_id,
    payment_amount, commission_percent, amount, status
  ) VALUES (
    _partner_id, NEW.school_id, NEW.id,
    NEW.amount, _commission_pct,
    ROUND((NEW.amount * _commission_pct / 100)::numeric, 2),
    'pending'
  )
  ON CONFLICT (platform_payment_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_partner_commission
AFTER INSERT ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.create_partner_commission();

-- 10. updated_at trigger for partners
CREATE TRIGGER trg_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. RLS policies — partners
CREATE POLICY "Platform admins manage partners"
ON public.partners FOR ALL TO authenticated
USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "Partners view own record"
ON public.partners FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 12. RLS policies — partner_commissions
CREATE POLICY "Platform admins manage commissions"
ON public.partner_commissions FOR ALL TO authenticated
USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "Partners view own commissions"
ON public.partner_commissions FOR SELECT TO authenticated
USING (partner_id = get_my_partner_id());

-- 13. RLS policies — partner_payouts
CREATE POLICY "Platform admins manage payouts"
ON public.partner_payouts FOR ALL TO authenticated
USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "Partners view own payouts"
ON public.partner_payouts FOR SELECT TO authenticated
USING (partner_id = get_my_partner_id());