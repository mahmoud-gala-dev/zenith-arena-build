
DROP POLICY IF EXISTS "Public read media" ON public.media_files;
CREATE POLICY "Staff can view media"
  ON public.media_files FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "qa_report_media_public_read" ON public.qa_report_media;
CREATE POLICY "qa_report_media_staff_read"
  ON public.qa_report_media FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));
