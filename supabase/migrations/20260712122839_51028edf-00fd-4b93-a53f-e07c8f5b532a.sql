
CREATE POLICY "applications_staff_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'applications' AND public.is_staff(auth.uid()));
CREATE POLICY "applications_staff_write" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'applications' AND public.is_staff(auth.uid())) WITH CHECK (bucket_id = 'applications' AND public.is_staff(auth.uid()));
