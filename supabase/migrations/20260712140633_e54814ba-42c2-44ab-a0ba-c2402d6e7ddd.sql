
DROP FUNCTION IF EXISTS public.get_page_by_preview_token(text);

CREATE OR REPLACE FUNCTION public.get_page_by_preview_token(_token text)
 RETURNS TABLE(id uuid, slug_en text, slug_ar text, title_en text, title_ar text, content_en text, content_ar text, seo_title_en text, seo_title_ar text, seo_description_en text, seo_description_ar text, status text, effective_at timestamp with time zone, updated_at timestamp with time zone, version_number integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_page_id UUID;
  v_version_id UUID;
  v_snap JSONB;
  v_vnum INTEGER;
BEGIN
  SELECT t.page_id, t.version_id INTO v_page_id, v_version_id
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

  IF v_version_id IS NOT NULL THEN
    SELECT pv.snapshot, pv.version_number INTO v_snap, v_vnum
      FROM public.page_versions pv
     WHERE pv.id = v_version_id
     LIMIT 1;

    IF v_snap IS NOT NULL THEN
      RETURN QUERY SELECT
        (v_snap->>'id')::uuid,
        v_snap->>'slug_en',
        v_snap->>'slug_ar',
        v_snap->>'title_en',
        v_snap->>'title_ar',
        v_snap->>'content_en',
        v_snap->>'content_ar',
        v_snap->>'seo_title_en',
        v_snap->>'seo_title_ar',
        v_snap->>'seo_description_en',
        v_snap->>'seo_description_ar',
        COALESCE(v_snap->>'status','draft'),
        NULLIF(v_snap->>'effective_at','')::timestamptz,
        NULLIF(v_snap->>'updated_at','')::timestamptz,
        v_vnum;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY
    SELECT p.id, p.slug_en, p.slug_ar, p.title_en, p.title_ar,
           p.content_en, p.content_ar,
           p.seo_title_en, p.seo_title_ar,
           p.seo_description_en, p.seo_description_ar,
           p.status::text, p.effective_at, p.updated_at,
           NULL::integer
      FROM public.pages p
     WHERE p.id = v_page_id;
END $function$;
