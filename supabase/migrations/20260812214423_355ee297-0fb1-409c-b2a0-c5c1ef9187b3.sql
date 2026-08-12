CREATE OR REPLACE FUNCTION public.admin_list_tables()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT c.relname::text
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
     ORDER BY c.relname;
END $$;

CREATE OR REPLACE FUNCTION public.admin_exec_sql(_sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _sql IS NULL OR length(btrim(_sql)) = 0 THEN
    RETURN;
  END IF;
  EXECUTE _sql;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_tables() FROM anon;
REVOKE ALL ON FUNCTION public.admin_exec_sql(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exec_sql(text) TO authenticated;