
CREATE POLICY "Staff manage downloads bucket - insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'downloads' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff manage downloads bucket - update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'downloads' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'downloads' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff manage downloads bucket - delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'downloads' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff read downloads bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'downloads' AND public.is_staff(auth.uid()));
