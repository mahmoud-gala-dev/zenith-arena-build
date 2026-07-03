
-- 1) Lock down public leads inserts. Submissions now go via a server function.
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

-- 2) Revoke default PUBLIC EXECUTE on SECURITY DEFINER functions.
--    Trigger-only functions need no external EXECUTE.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_first_user_super_admin() FROM PUBLIC, anon, authenticated;

-- has_role / is_staff are used inside RLS policies (as authenticated).
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- update_updated_at_column is a trigger fn (not SECURITY DEFINER but tidy up).
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
