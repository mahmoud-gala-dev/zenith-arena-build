ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS fog_intensity numeric NOT NULL DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS spotlight_intensity numeric NOT NULL DEFAULT 0.6,
  ADD COLUMN IF NOT EXISTS vignette_intensity numeric NOT NULL DEFAULT 0.6;