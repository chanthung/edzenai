-- Partner invites table (separate from user_invites because no school_id)
CREATE TABLE public.partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_invites_token ON public.partner_invites(token);
CREATE INDEX idx_partner_invites_partner ON public.partner_invites(partner_id);

ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

-- Platform admins manage all
CREATE POLICY "Platform admins manage partner invites"
ON public.partner_invites
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Public can read valid pending invite by token (needed for accept page)
CREATE POLICY "Public can view valid pending partner invite"
ON public.partner_invites
FOR SELECT
TO anon, authenticated
USING (accepted_at IS NULL AND expires_at > now());

-- Service role full access
CREATE POLICY "Service role full access partner invites"
ON public.partner_invites
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- updated_at trigger
CREATE TRIGGER trg_partner_invites_updated_at
BEFORE UPDATE ON public.partner_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();