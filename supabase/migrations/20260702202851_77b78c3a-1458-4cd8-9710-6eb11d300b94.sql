
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS cover_image_variants JSONB,
  ADD COLUMN IF NOT EXISTS header_image_variants JSONB,
  ADD COLUMN IF NOT EXISTS og_image_variants JSONB;
