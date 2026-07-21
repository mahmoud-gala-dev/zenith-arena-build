
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_permissions() FROM anon, PUBLIC;

DROP POLICY IF EXISTS "Anyone can log download events" ON public.download_events;
CREATE POLICY "Anyone can log download events"
  ON public.download_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event_type IN ('view','click','download','gate_open','gate_submit')
    AND (download_id IS NULL OR EXISTS (
      SELECT 1 FROM public.downloads d
      WHERE d.id = download_events.download_id AND d.status = 'published'
    ))
    AND (path IS NULL OR length(path) <= 512)
    AND (referrer IS NULL OR length(referrer) <= 1024)
    AND (user_agent IS NULL OR length(user_agent) <= 512)
    AND (language IS NULL OR length(language) <= 16)
  );
