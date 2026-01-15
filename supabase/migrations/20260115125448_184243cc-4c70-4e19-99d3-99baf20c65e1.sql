-- 1. Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'school_admin');

-- 2. Create user_roles table (roles stored separately per security guidelines)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'platform_admin'
  )
$$;

-- 5. Create security definer function to check any role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. RLS policies for user_roles table
CREATE POLICY "Platform admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY "Platform admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_platform_admin());

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- 7. Drop existing schools INSERT policy (we'll replace it)
DROP POLICY IF EXISTS "Authenticated users can create schools" ON public.schools;

-- 8. Create new INSERT policy - only platform admins can create schools
CREATE POLICY "Only platform admins can create schools"
ON public.schools FOR INSERT
WITH CHECK (public.is_platform_admin());

-- 9. Update SELECT policy - platform admins see all, school admins see their own
DROP POLICY IF EXISTS "Admins can view their schools" ON public.schools;
DROP POLICY IF EXISTS "Public can view schools" ON public.schools;

CREATE POLICY "Platform admins can view all schools"
ON public.schools FOR SELECT
USING (public.is_platform_admin());

CREATE POLICY "School admins can view their own school"
ON public.schools FOR SELECT
USING (id IN (SELECT get_user_school_ids()));

-- 10. Update UPDATE policy
DROP POLICY IF EXISTS "Admins can update their schools" ON public.schools;

CREATE POLICY "Platform admins can update all schools"
ON public.schools FOR UPDATE
USING (public.is_platform_admin());

CREATE POLICY "School admins can update their own school"
ON public.schools FOR UPDATE
USING (id IN (SELECT get_user_school_ids()));

-- 11. Allow platform admins to delete schools
CREATE POLICY "Platform admins can delete schools"
ON public.schools FOR DELETE
USING (public.is_platform_admin());

-- 12. Update school_admins INSERT policy - platform admins can add school admins
DROP POLICY IF EXISTS "Existing admins can add new admins to their schools" ON public.school_admins;

CREATE POLICY "Platform admins can manage school admins"
ON public.school_admins FOR INSERT
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Existing school admins can add admins to their schools"
ON public.school_admins FOR INSERT
WITH CHECK (school_id IN (SELECT get_user_school_ids()));