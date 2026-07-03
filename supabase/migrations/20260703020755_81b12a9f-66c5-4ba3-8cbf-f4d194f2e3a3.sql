
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS og_image_ar text,
  ADD COLUMN IF NOT EXISTS og_image_ar_variants jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS services_search_en_idx
  ON public.services USING gin (to_tsvector('simple', coalesce(title_en,'') || ' ' || coalesce(description_en,'')));
CREATE INDEX IF NOT EXISTS services_search_ar_idx
  ON public.services USING gin (to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(description_ar,'')));
