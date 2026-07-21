ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'article'
  CHECK (content_type IN ('article','guide','case_study'));

CREATE INDEX IF NOT EXISTS blog_posts_content_type_idx
  ON public.blog_posts (content_type);