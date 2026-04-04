
DROP POLICY IF EXISTS "No direct access to parent link dispatches" ON public.parent_link_dispatches;

CREATE POLICY "Admins can view parent link dispatches of their schools"
ON public.parent_link_dispatches
FOR SELECT
TO authenticated
USING (school_id IN (SELECT get_user_school_ids()));
