ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS whatsapp_thread jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_last_at timestamptz;
CREATE INDEX IF NOT EXISTS leads_whatsapp_last_at_idx ON public.leads (whatsapp_last_at DESC);