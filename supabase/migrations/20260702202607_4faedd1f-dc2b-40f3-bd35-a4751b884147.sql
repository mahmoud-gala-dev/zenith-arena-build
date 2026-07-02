
-- Public read for service-media bucket
CREATE POLICY "service_media_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'service-media');

-- Authenticated staff can upload
CREATE POLICY "service_media_staff_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-media' AND public.is_staff(auth.uid()));

CREATE POLICY "service_media_staff_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-media' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'service-media' AND public.is_staff(auth.uid()));

CREATE POLICY "service_media_staff_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-media' AND public.is_staff(auth.uid()));
