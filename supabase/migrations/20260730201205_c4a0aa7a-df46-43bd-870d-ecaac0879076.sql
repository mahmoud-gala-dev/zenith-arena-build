CREATE TABLE public.rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_bucket_created ON public.rate_limits (bucket_key, created_at DESC);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view rate limit records"
  ON public.rate_limits FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.rate_limit_hit(_key text, _max integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  IF _key IS NULL OR length(_key) = 0 OR _max < 1 OR _window_seconds < 1 THEN
    RETURN false;
  END IF;

  DELETE FROM public.rate_limits
   WHERE created_at < now() - make_interval(secs => greatest(_window_seconds, 3600));

  SELECT count(*) INTO v_count
    FROM public.rate_limits
   WHERE bucket_key = _key
     AND created_at > now() - make_interval(secs => _window_seconds);

  IF v_count >= _max THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (bucket_key) VALUES (_key);
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;