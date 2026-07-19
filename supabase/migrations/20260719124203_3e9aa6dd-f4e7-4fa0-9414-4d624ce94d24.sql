
-- 1) Restrict permissions catalogs to staff
DROP POLICY IF EXISTS "Authenticated users can read permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON public.role_permissions;

CREATE POLICY "Staff can read permissions"
  ON public.permissions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can read role permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2) Remove overscoped public SELECT on private downloads bucket
DROP POLICY IF EXISTS "Public read downloads bucket for signing" ON storage.objects;

-- 3) Lock down internal SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'log_admin_event(text,text,text,jsonb)',
    'handle_new_user()',
    'update_updated_at_column()',
    'grant_first_user_super_admin()',
    'notify_pages_now_live()',
    'log_audit()',
    'publish_due_hero_slides()',
    'reset_page_live_notified()',
    'snapshot_page_version()',
    'notify_page_publish_change()',
    'notify_qa_submitted()',
    'publish_due_blog_posts()'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;
