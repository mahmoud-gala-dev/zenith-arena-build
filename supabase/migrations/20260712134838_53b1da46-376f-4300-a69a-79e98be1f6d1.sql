
-- 1) Trigger: notify on status/effective_at change (instant Published/Unpublished + schedule set)
CREATE OR REPLACE FUNCTION public.notify_page_publish_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT := COALESCE(NEW.slug_en, NEW.slug_ar, 'page');
  v_title TEXT := COALESCE(NEW.title_en, NEW.title_ar, v_slug);
  v_actor UUID := auth.uid();
  v_email TEXT;
  v_kind TEXT;
  v_ntitle TEXT;
  v_body TEXT;
  v_now TIMESTAMPTZ := now();
  v_status_changed BOOLEAN := (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status);
  v_eff_changed BOOLEAN := (TG_OP = 'INSERT') OR (NEW.effective_at IS DISTINCT FROM OLD.effective_at);
BEGIN
  IF NOT v_status_changed AND NOT v_eff_changed THEN
    RETURN NEW;
  END IF;

  BEGIN SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;

  IF v_status_changed AND NEW.status = 'published' THEN
    IF NEW.effective_at IS NOT NULL AND NEW.effective_at > v_now THEN
      v_kind := 'page_scheduled';
      v_ntitle := 'Page scheduled: ' || v_title;
      v_body := COALESCE(v_email, 'A user') || ' scheduled "' || v_title || '" (/' || v_slug ||
                ') to go live on ' || to_char(NEW.effective_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI UTC') || '.';
    ELSE
      v_kind := 'page_published';
      v_ntitle := 'Page published: ' || v_title;
      v_body := COALESCE(v_email, 'A user') || ' published "' || v_title || '" (/' || v_slug || ') — now live to visitors.';
    END IF;
  ELSIF v_status_changed AND NEW.status = 'draft' THEN
    v_kind := 'page_unpublished';
    v_ntitle := 'Page unpublished: ' || v_title;
    v_body := COALESCE(v_email, 'A user') || ' unpublished "' || v_title || '" (/' || v_slug || ') — hidden from visitors.';
  ELSIF v_eff_changed AND NEW.status = 'published' THEN
    IF NEW.effective_at IS NULL THEN
      v_kind := 'page_schedule_cleared';
      v_ntitle := 'Schedule removed: ' || v_title;
      v_body := COALESCE(v_email, 'A user') || ' removed the effective date for "' || v_title || '" (/' || v_slug || ').';
    ELSE
      v_kind := 'page_scheduled';
      v_ntitle := 'Page schedule updated: ' || v_title;
      v_body := COALESCE(v_email, 'A user') || ' scheduled "' || v_title || '" (/' || v_slug ||
                ') for ' || to_char(NEW.effective_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI UTC') || '.';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (kind, title, body, link, ref_table, ref_id)
  VALUES (v_kind, v_ntitle, v_body, '/admin/legal', 'pages', NEW.id::text);

  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.notify_page_publish_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pages_notify_publish_change ON public.pages;
CREATE TRIGGER pages_notify_publish_change
AFTER INSERT OR UPDATE OF status, effective_at ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.notify_page_publish_change();

-- 2) Track go-live moment for scheduled pages (effective_at crosses now())
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS live_notified_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.notify_pages_now_live()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_count INTEGER := 0;
  v_slug TEXT;
  v_title TEXT;
BEGIN
  FOR r IN
    SELECT id, slug_en, slug_ar, title_en, title_ar, effective_at
      FROM public.pages
     WHERE status = 'published'
       AND effective_at IS NOT NULL
       AND effective_at <= now()
       AND live_notified_at IS NULL
  LOOP
    v_slug := COALESCE(r.slug_en, r.slug_ar, 'page');
    v_title := COALESCE(r.title_en, r.title_ar, v_slug);

    INSERT INTO public.admin_notifications (kind, title, body, link, ref_table, ref_id)
    VALUES (
      'page_went_live',
      'Scheduled page is now live: ' || v_title,
      '"' || v_title || '" (/' || v_slug || ') reached its effective date and is now visible to visitors.',
      '/admin/legal',
      'pages',
      r.id::text
    );

    UPDATE public.pages SET live_notified_at = now() WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.notify_pages_now_live() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_pages_now_live() TO authenticated;

-- Backfill: mark already-live scheduled pages as notified so we don't spam on first cron tick.
UPDATE public.pages
   SET live_notified_at = now()
 WHERE status = 'published'
   AND effective_at IS NOT NULL
   AND effective_at <= now()
   AND live_notified_at IS NULL;

-- Reset the flag when the page is unpublished or rescheduled to a future date,
-- so a later go-live still fires exactly one notification.
CREATE OR REPLACE FUNCTION public.reset_page_live_notified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'draft')
     OR (NEW.effective_at IS DISTINCT FROM OLD.effective_at
         AND NEW.effective_at IS NOT NULL
         AND NEW.effective_at > now()) THEN
    NEW.live_notified_at := NULL;
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.reset_page_live_notified() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS pages_reset_live_notified ON public.pages;
CREATE TRIGGER pages_reset_live_notified
BEFORE UPDATE OF status, effective_at ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.reset_page_live_notified();

-- 3) Schedule via pg_cron: check every minute for pages that just went live.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'notify_pages_now_live_every_minute';
SELECT cron.schedule(
  'notify_pages_now_live_every_minute',
  '* * * * *',
  $$SELECT public.notify_pages_now_live();$$
);
