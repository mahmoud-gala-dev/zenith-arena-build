
-- Image version history for CMS entities (cover/header/og replacements).
CREATE TABLE public.image_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('cover_image','header_image','og_image')),
  url TEXT,
  variants JSONB,
  replaced_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX image_versions_lookup_idx ON public.image_versions(entity_table, entity_id, field, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.image_versions TO authenticated;
GRANT ALL ON public.image_versions TO service_role;

ALTER TABLE public.image_versions ENABLE ROW LEVEL SECURITY;

-- Only staff can view and manage image history.
CREATE POLICY "Staff can read image versions"
  ON public.image_versions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert image versions"
  ON public.image_versions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete image versions"
  ON public.image_versions FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));
