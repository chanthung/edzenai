ALTER TABLE public.school_teachers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.school_teachers ALTER COLUMN user_id DROP NOT NULL;
COMMENT ON COLUMN public.school_teachers.user_id IS 'Linked auth account. NULL = HR-only record (Not invited); such rows match no auth.uid() check and grant no access.';
COMMENT ON COLUMN public.school_teachers.email IS 'School email. NULL for HR-only records imported without an email; never invent placeholder addresses.';