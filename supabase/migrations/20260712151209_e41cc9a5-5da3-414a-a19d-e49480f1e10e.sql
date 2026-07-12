ALTER TABLE public.downloads
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.downloads.files IS 'Array of {label_en, label_ar, url, lang: "en"|"ar"|"both", size, mime}';
COMMENT ON COLUMN public.downloads.gallery IS 'Array of preview image URLs (strings)';