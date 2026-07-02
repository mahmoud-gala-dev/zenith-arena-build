
ALTER TABLE public.hero_slides
  DROP CONSTRAINT IF EXISTS hero_slides_fog_intensity_range,
  DROP CONSTRAINT IF EXISTS hero_slides_spotlight_intensity_range,
  DROP CONSTRAINT IF EXISTS hero_slides_vignette_intensity_range;

UPDATE public.hero_slides SET fog_intensity = GREATEST(0, LEAST(1, COALESCE(fog_intensity, 0.6)));
UPDATE public.hero_slides SET spotlight_intensity = GREATEST(0, LEAST(1, COALESCE(spotlight_intensity, 0.6)));
UPDATE public.hero_slides SET vignette_intensity = GREATEST(0, LEAST(1, COALESCE(vignette_intensity, 0.6)));

ALTER TABLE public.hero_slides
  ADD CONSTRAINT hero_slides_fog_intensity_range CHECK (fog_intensity IS NULL OR (fog_intensity >= 0 AND fog_intensity <= 1)),
  ADD CONSTRAINT hero_slides_spotlight_intensity_range CHECK (spotlight_intensity IS NULL OR (spotlight_intensity >= 0 AND spotlight_intensity <= 1)),
  ADD CONSTRAINT hero_slides_vignette_intensity_range CHECK (vignette_intensity IS NULL OR (vignette_intensity >= 0 AND vignette_intensity <= 1));
