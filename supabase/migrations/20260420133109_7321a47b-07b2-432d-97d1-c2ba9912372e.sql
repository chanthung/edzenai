
-- Enum for delivery method
DO $$ BEGIN
  CREATE TYPE public.invite_delivery_method AS ENUM ('email', 'whatsapp', 'both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_invites table
CREATE TABLE IF NOT EXISTS public.user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email text NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'accountant')),
  name text NOT NULL,
  invited_by uuid NOT NULL,
  delivery_method public.invite_delivery_method NOT NULL DEFAULT 'email',
  phone text,
  assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_invites_token ON public.user_invites(token);
CREATE INDEX IF NOT EXISTS idx_user_invites_school_id ON public.user_invites(school_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_email ON public.user_invites(email);

-- updated_at trigger
CREATE TRIGGER update_user_invites_updated_at
  BEFORE UPDATE ON public.user_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- School admins manage invites for their school
CREATE POLICY "Admins manage invites for their school"
  ON public.user_invites
  FOR ALL
  TO authenticated
  USING (school_id IN (SELECT public.get_user_school_ids()))
  WITH CHECK (school_id IN (SELECT public.get_user_school_ids()));

-- Public lookup of a single invite by token (only if pending and not expired)
CREATE POLICY "Public can view valid pending invite by token"
  ON public.user_invites
  FOR SELECT
  TO anon, authenticated
  USING (accepted_at IS NULL AND expires_at > now());

-- Service role full access (edge functions)
CREATE POLICY "Service role full access invites"
  ON public.user_invites
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
