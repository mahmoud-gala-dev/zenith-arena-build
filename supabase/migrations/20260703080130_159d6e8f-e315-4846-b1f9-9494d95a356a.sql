
-- 1) Hero slides: scheduling + per-language ordering
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS sort_order_ar integer;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name='hero_slides_status_chk') THEN
    ALTER TABLE public.hero_slides ADD CONSTRAINT hero_slides_status_chk CHECK (status IN ('draft','published'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS hero_slides_status_scheduled_idx
  ON public.hero_slides (status, scheduled_at);

-- 2) QA report media (multiple attachments per report)
CREATE TABLE IF NOT EXISTS public.qa_report_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.qa_reports(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.qa_report_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.qa_report_media TO authenticated;
GRANT ALL ON public.qa_report_media TO service_role;

ALTER TABLE public.qa_report_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_report_media_public_read" ON public.qa_report_media
  FOR SELECT USING (true);
CREATE POLICY "qa_report_media_staff_write" ON public.qa_report_media
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_qa_report_media_updated
  BEFORE UPDATE ON public.qa_report_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS qa_report_media_report_idx
  ON public.qa_report_media(report_id, sort_order);

-- 3) Audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,           -- INSERT | UPDATE | DELETE
  table_name text NOT NULL,
  record_id text,
  changes jsonb,                  -- {old, new, diff}
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_staff_read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_old jsonb;
  v_new jsonb;
  v_diff jsonb;
  v_rec_id text;
BEGIN
  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_rec_id := (v_old->>'id');
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_rec_id := (v_new->>'id');
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_rec_id := (v_new->>'id');
    SELECT jsonb_object_agg(key, value) INTO v_diff
      FROM jsonb_each(v_new)
      WHERE v_old->key IS DISTINCT FROM value;
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, table_name, record_id, changes)
  VALUES (
    v_actor, v_email, TG_OP, TG_TABLE_NAME, v_rec_id,
    jsonb_strip_nulls(jsonb_build_object('old', v_old, 'new', v_new, 'diff', v_diff))
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_audit_hero_slides ON public.hero_slides;
CREATE TRIGGER trg_audit_hero_slides
  AFTER INSERT OR UPDATE OR DELETE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

DROP TRIGGER IF EXISTS trg_audit_blog_posts ON public.blog_posts;
CREATE TRIGGER trg_audit_blog_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

DROP TRIGGER IF EXISTS trg_audit_qa_reports ON public.qa_reports;
CREATE TRIGGER trg_audit_qa_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.qa_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

CREATE INDEX IF NOT EXISTS audit_logs_table_created_idx
  ON public.audit_logs (table_name, created_at DESC);
