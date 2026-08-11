ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS gemini_model text NOT NULL DEFAULT 'gemini-3.5-flash',
  ADD COLUMN IF NOT EXISTS gemini_rotate_keys boolean NOT NULL DEFAULT true;

ALTER TABLE public.ai_settings
  ADD CONSTRAINT ai_settings_provider_check CHECK (provider IN ('lovable','gemini'));

CREATE TABLE IF NOT EXISTS public.ai_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'gemini',
  label text NOT NULL,
  api_key text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  last_status text,
  last_error text,
  last_tested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_api_keys TO authenticated;
GRANT ALL ON public.ai_api_keys TO service_role;

ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_manage_ai_api_keys" ON public.ai_api_keys;
CREATE POLICY "super_admin_manage_ai_api_keys"
  ON public.ai_api_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));