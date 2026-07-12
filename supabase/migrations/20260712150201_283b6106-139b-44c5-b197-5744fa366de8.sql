
CREATE TABLE public.download_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('view_index','view_detail','download')),
  download_id UUID REFERENCES public.downloads(id) ON DELETE SET NULL,
  path TEXT,
  referrer TEXT,
  referrer_host TEXT,
  user_agent TEXT,
  language TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_download_events_created_at ON public.download_events (created_at DESC);
CREATE INDEX idx_download_events_download_id ON public.download_events (download_id);
CREATE INDEX idx_download_events_type ON public.download_events (event_type);

GRANT INSERT ON public.download_events TO anon, authenticated;
GRANT SELECT ON public.download_events TO authenticated;
GRANT ALL ON public.download_events TO service_role;

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log download events"
  ON public.download_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read download events"
  ON public.download_events FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));
