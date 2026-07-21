ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO public.permissions (key, label, description)
VALUES
  ('blog.article.attachments',    'Manage article attachments',     'Upload/remove downloadable files on articles'),
  ('blog.guide.attachments',      'Manage guide attachments',       'Upload/remove downloadable files on guides'),
  ('blog.case_study.attachments', 'Manage case study attachments',  'Upload/remove downloadable files on case studies')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (VALUES ('super_admin'::app_role), ('admin'::app_role), ('editor'::app_role)) AS r(role)
CROSS JOIN public.permissions p
WHERE p.key IN ('blog.article.attachments','blog.guide.attachments','blog.case_study.attachments')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'content_manager'::app_role, p.id
FROM public.permissions p
WHERE p.key = 'blog.article.attachments'
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "article-attachments read" ON storage.objects;
CREATE POLICY "article-attachments read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'article-attachments');

DROP POLICY IF EXISTS "article-attachments staff insert" ON storage.objects;
CREATE POLICY "article-attachments staff insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'article-attachments' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "article-attachments staff update" ON storage.objects;
CREATE POLICY "article-attachments staff update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'article-attachments' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'article-attachments' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "article-attachments staff delete" ON storage.objects;
CREATE POLICY "article-attachments staff delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'article-attachments' AND public.is_staff(auth.uid()));