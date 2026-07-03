
REVOKE EXECUTE ON FUNCTION public.publish_due_hero_slides() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.publish_due_hero_slides() TO service_role;
