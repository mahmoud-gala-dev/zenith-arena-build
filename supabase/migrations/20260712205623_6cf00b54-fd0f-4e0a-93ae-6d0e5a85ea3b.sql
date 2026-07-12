-- Tighten leads grants to match RLS policies (principle of least privilege).
-- Public lead submissions go through a server function using service_role,
-- so the Data API never needs INSERT/anon access.

REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM authenticated;

-- Staff (authenticated + is_staff/has_role check in RLS) needs read + write access;
-- INSERT is intentionally not granted (creation is server-side only).
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;

-- Server-side writes (createServerFn using service_role) keep full access.
GRANT ALL ON public.leads TO service_role;