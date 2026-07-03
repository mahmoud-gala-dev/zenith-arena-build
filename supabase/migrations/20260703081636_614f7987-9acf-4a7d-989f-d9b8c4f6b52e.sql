
-- 1. QA Reports workflow status
DO $$ BEGIN
  CREATE TYPE public.qa_report_status AS ENUM ('draft','submitted','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.qa_reports
  ADD COLUMN IF NOT EXISTS status public.qa_report_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_note text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  ref_table text,
  ref_id text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read notifications" ON public.admin_notifications;
CREATE POLICY "staff read notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff write notifications" ON public.admin_notifications;
CREATE POLICY "staff write notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff delete notifications" ON public.admin_notifications;
CREATE POLICY "staff delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "system insert notifications" ON public.admin_notifications;
CREATE POLICY "system insert notifications" ON public.admin_notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 3. Auto-notify on QA submission
CREATE OR REPLACE FUNCTION public.notify_qa_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'submitted')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'submitted' AND COALESCE(OLD.status::text,'') <> 'submitted') THEN
    BEGIN SELECT email INTO v_email FROM auth.users WHERE id = NEW.created_by; EXCEPTION WHEN OTHERS THEN v_email := NULL; END;
    INSERT INTO public.admin_notifications (kind, title, body, link, ref_table, ref_id)
    VALUES (
      'qa_submitted',
      'QA report submitted for review',
      COALESCE(v_email,'A user') || ' submitted a QA report for ' || COALESCE(NEW.page,'/') || ' (' || COALESCE(NEW.viewport,'') || ')',
      '/admin/qa-reports',
      'qa_reports',
      NEW.id::text
    );
  END IF;
  IF (TG_OP = 'UPDATE' AND NEW.status = 'submitted' AND COALESCE(OLD.status::text,'') <> 'submitted') THEN
    NEW.submitted_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_qa_submitted ON public.qa_reports;
CREATE TRIGGER trg_notify_qa_submitted
  BEFORE INSERT OR UPDATE ON public.qa_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_qa_submitted();

-- 4. Auto-publish scheduled hero slides (cron helper — safe to call any time)
CREATE OR REPLACE FUNCTION public.publish_due_hero_slides()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.hero_slides
       SET status = 'published'
     WHERE status = 'draft'
       AND scheduled_at IS NOT NULL
       AND scheduled_at <= now()
    RETURNING id
  ) SELECT count(*) INTO v_count FROM updated;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION public.publish_due_hero_slides() TO authenticated, anon;
