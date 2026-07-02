
CREATE TABLE public.qa_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  commit_sha TEXT,
  branch TEXT,
  viewport TEXT NOT NULL,
  page TEXT NOT NULL,
  lcp_ms INTEGER,
  cls NUMERIC(6,3),
  wa_overlap BOOLEAN DEFAULT false,
  more_opened BOOLEAN,
  screenshot_url TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX qa_reports_run_at_idx ON public.qa_reports (run_at DESC);
CREATE INDEX qa_reports_page_idx ON public.qa_reports (page);

GRANT SELECT ON public.qa_reports TO authenticated;
GRANT ALL ON public.qa_reports TO service_role;

ALTER TABLE public.qa_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read qa_reports"
  ON public.qa_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
