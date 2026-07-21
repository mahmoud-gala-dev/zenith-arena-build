
INSERT INTO public.permissions (key, label, description)
VALUES
  ('content.ai.run', 'Run AI assistant', 'Run AI assistant actions (improve, translate, generate, summarize)'),
  ('content.ai.undo', 'Undo / regenerate AI edits', 'Undo or regenerate AI-generated edits')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r::public.app_role, p.id
FROM (VALUES ('super_admin'),('admin'),('editor'),('content_manager')) AS x(r)
CROSS JOIN public.permissions p
WHERE p.key = 'content.ai.run'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r::public.app_role, p.id
FROM (VALUES ('super_admin'),('admin'),('editor')) AS x(r)
CROSS JOIN public.permissions p
WHERE p.key = 'content.ai.undo'
ON CONFLICT DO NOTHING;
