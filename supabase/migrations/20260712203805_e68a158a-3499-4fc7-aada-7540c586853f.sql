
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS translation_group_id UUID NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_blog_posts_translation_group
  ON public.blog_posts (translation_group_id);
