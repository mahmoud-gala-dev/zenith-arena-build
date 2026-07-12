
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at
  ON public.blog_posts (scheduled_at)
  WHERE status = 'draft' AND scheduled_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.publish_due_blog_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.blog_posts
       SET status = 'published',
           published_at = COALESCE(published_at, scheduled_at, now())
     WHERE status = 'draft'
       AND scheduled_at IS NOT NULL
       AND scheduled_at <= now()
    RETURNING id
  ) SELECT count(*) INTO v_count FROM updated;
  RETURN v_count;
END $$;
