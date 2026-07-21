
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  model text,
  prompt_tokens int DEFAULT 0,
  completion_tokens int DEFAULT 0,
  total_tokens int DEFAULT 0,
  duration_ms int,
  target_table text,
  target_id text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_logs_user_created_idx ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX ai_usage_logs_action_idx ON public.ai_usage_logs(action);

GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI usage or staff view all"
ON public.ai_usage_logs FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Auth insert own AI usage"
ON public.ai_usage_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  advanced_model text NOT NULL DEFAULT 'google/gemini-3.1-pro-preview',
  tone text NOT NULL DEFAULT 'professional',
  glossary jsonb NOT NULL DEFAULT '[]'::jsonb,
  daily_user_limit int NOT NULL DEFAULT 200,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view AI settings"
ON public.ai_settings FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins manage AI settings"
ON public.ai_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

INSERT INTO public.ai_settings (default_model, tone, glossary)
VALUES (
  'google/gemini-3-flash-preview',
  'professional',
  '[{"term":"Egytic Sports","translation":"Egytic Sports","note":"Brand name — never translate"}]'::jsonb
);

INSERT INTO public.permissions (key, label, description)
VALUES ('content.ai', 'Use AI Assistant', 'Use AI to generate, translate, and improve content')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (VALUES ('super_admin'::app_role), ('admin'::app_role), ('editor'::app_role), ('content_manager'::app_role)) AS r(role)
CROSS JOIN public.permissions p
WHERE p.key = 'content.ai'
ON CONFLICT DO NOTHING;
