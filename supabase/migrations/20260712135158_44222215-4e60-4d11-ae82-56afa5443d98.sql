
CREATE TABLE public.page_preview_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_preview_tokens_page_idx ON public.page_preview_tokens(page_id);
CREATE INDEX page_preview_tokens_token_idx ON public.page_preview_tokens(token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_preview_tokens TO authenticated;
GRANT ALL ON public.page_preview_tokens TO service_role;

ALTER TABLE public.page_preview_tokens ENABLE ROW LEVEL SECURITY;

-- Only staff (admin/editor/content_manager/super_admin) can manage tokens.
CREATE POLICY "Staff can view preview tokens"
  ON public.page_preview_tokens FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create preview tokens"
  ON public.page_preview_tokens FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Staff can revoke preview tokens"
  ON public.page_preview_tokens FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete preview tokens"
  ON public.page_preview_tokens FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- Public resolver: verifies a token and returns the page draft (bypasses RLS via SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.get_page_by_preview_token(_token TEXT)
RETURNS TABLE (
  id UUID,
  slug_en TEXT,
  slug_ar TEXT,
  title_en TEXT,
  title_ar TEXT,
  content_en TEXT,
  content_ar TEXT,
  seo_title_en TEXT,
  seo_title_ar TEXT,
  seo_description_en TEXT,
  seo_description_ar TEXT,
  status TEXT,
  effective_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id UUID;
BEGIN
  SELECT t.page_id INTO v_page_id
  FROM public.page_preview_tokens t
  WHERE t.token = _token
    AND t.revoked_at IS NULL
    AND t.expires_at > now()
  LIMIT 1;

  IF v_page_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.page_preview_tokens
     SET last_viewed_at = now(),
         view_count = view_count + 1
   WHERE token = _token;

  RETURN QUERY
    SELECT p.id, p.slug_en, p.slug_ar, p.title_en, p.title_ar,
           p.content_en, p.content_ar,
           p.seo_title_en, p.seo_title_ar,
           p.seo_description_en, p.seo_description_ar,
           p.status::text, p.effective_at, p.updated_at
      FROM public.pages p
     WHERE p.id = v_page_id;
END $$;

REVOKE ALL ON FUNCTION public.get_page_by_preview_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_page_by_preview_token(TEXT) TO anon, authenticated;
