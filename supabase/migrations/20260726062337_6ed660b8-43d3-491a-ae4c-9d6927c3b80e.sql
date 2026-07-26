DROP POLICY IF EXISTS "Public can view active hero slides" ON public.hero_slides;

CREATE POLICY "Public can view active hero slides"
  ON public.hero_slides
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      is_active = true
      AND status = 'published'
      AND (scheduled_at IS NULL OR scheduled_at <= now())
    )
    OR is_staff(auth.uid())
  );