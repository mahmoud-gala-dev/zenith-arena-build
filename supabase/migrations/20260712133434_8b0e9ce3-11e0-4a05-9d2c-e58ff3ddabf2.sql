ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS effective_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_pages_effective_at ON public.pages (effective_at);