
CREATE POLICY "Public read downloads bucket for signing" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'downloads');
