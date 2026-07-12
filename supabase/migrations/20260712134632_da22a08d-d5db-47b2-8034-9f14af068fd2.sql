
CREATE TABLE public.page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_versions TO authenticated;
GRANT ALL ON public.page_versions TO service_role;

ALTER TABLE public.page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read page versions"
  ON public.page_versions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert page versions"
  ON public.page_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_page_versions_page_id_created ON public.page_versions(page_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.snapshot_page_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_email TEXT;
  v_num INTEGER;
BEGIN
  BEGIN SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_num
    FROM public.page_versions WHERE page_id = NEW.id;

  INSERT INTO public.page_versions (page_id, version_number, snapshot, actor_id, actor_email, action)
  VALUES (NEW.id, v_num, to_jsonb(NEW), v_actor, v_email, TG_OP);

  RETURN NEW;
END $$;

CREATE TRIGGER pages_snapshot_version
AFTER INSERT OR UPDATE ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.snapshot_page_version();

-- Seed a v1 snapshot for existing rows so restore works from day one.
INSERT INTO public.page_versions (page_id, version_number, snapshot, action)
SELECT id, 1, to_jsonb(p.*), 'SEED' FROM public.pages p
ON CONFLICT DO NOTHING;
