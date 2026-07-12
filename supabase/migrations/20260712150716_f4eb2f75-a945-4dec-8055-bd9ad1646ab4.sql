ALTER TABLE public.downloads
  ADD COLUMN IF NOT EXISTS seo_title_en text,
  ADD COLUMN IF NOT EXISTS seo_title_ar text,
  ADD COLUMN IF NOT EXISTS seo_description_en text,
  ADD COLUMN IF NOT EXISTS seo_description_ar text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS og_image_ar text;