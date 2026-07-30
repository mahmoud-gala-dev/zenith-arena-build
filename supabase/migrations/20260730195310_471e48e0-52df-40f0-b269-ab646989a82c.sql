ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS referrer_host text,
  ADD COLUMN IF NOT EXISTS deal_value_expected numeric(14,2),
  ADD COLUMN IF NOT EXISTS deal_value_actual numeric(14,2),
  ADD COLUMN IF NOT EXISTS deal_currency text NOT NULL DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS expected_close_date date,
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text;

CREATE INDEX IF NOT EXISTS leads_utm_source_idx ON public.leads (utm_source);
CREATE INDEX IF NOT EXISTS leads_status_created_idx ON public.leads (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_lead_outcome_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'won' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.won_at := COALESCE(NEW.won_at, now());
    NEW.lost_at := NULL;
  ELSIF NEW.status = 'lost' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    NEW.lost_at := COALESCE(NEW.lost_at, now());
    NEW.won_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS leads_outcome_timestamps ON public.leads;
CREATE TRIGGER leads_outcome_timestamps
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.set_lead_outcome_timestamps();

CREATE OR REPLACE FUNCTION public.lead_pipeline_summary(_from timestamptz DEFAULT (now() - interval '365 days'), _to timestamptz DEFAULT now())
RETURNS TABLE(
  status lead_status,
  channel text,
  lead_count bigint,
  expected_value numeric,
  won_value numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.status,
         COALESCE(NULLIF(l.utm_source, ''), NULLIF(l.referrer_host, ''), NULLIF(l.source, ''), 'direct') AS channel,
         count(*)::bigint,
         COALESCE(sum(l.deal_value_expected), 0),
         COALESCE(sum(CASE WHEN l.status = 'won' THEN COALESCE(l.deal_value_actual, l.deal_value_expected) ELSE 0 END), 0)
    FROM public.leads l
   WHERE public.is_staff(auth.uid())
     AND l.created_at >= _from AND l.created_at <= _to
   GROUP BY 1, 2
$$;

REVOKE ALL ON FUNCTION public.lead_pipeline_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lead_pipeline_summary(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_pipeline_summary(timestamptz, timestamptz) TO service_role;