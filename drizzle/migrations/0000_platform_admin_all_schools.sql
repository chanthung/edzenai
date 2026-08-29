CREATE OR REPLACE FUNCTION public.get_user_school_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT s.id FROM public.schools s
  WHERE public.is_platform_admin()
  UNION
  SELECT sa.school_id FROM public.school_admins sa
  WHERE sa.user_id = auth.uid()
$function$;