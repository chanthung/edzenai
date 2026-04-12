CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts from the contact form
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Only platform admins can read submissions
CREATE POLICY "Platform admins can view submissions"
ON public.contact_submissions
FOR SELECT
USING (public.is_platform_admin());