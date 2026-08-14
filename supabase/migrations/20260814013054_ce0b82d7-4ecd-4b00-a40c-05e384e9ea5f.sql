CREATE OR REPLACE FUNCTION public.admin_dump_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  out_sql text := '';
  r record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  out_sql := out_sql || '-- ===== ENUM TYPES =====' || E'\n';
  FOR r IN
    SELECT t.typname AS name,
           string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS labels
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE n.nspname = 'public'
     GROUP BY t.typname
     ORDER BY t.typname
  LOOP
    out_sql := out_sql || 'DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=''public'' AND t.typname='
      || quote_literal(r.name) || ') THEN CREATE TYPE public.' || quote_ident(r.name)
      || ' AS ENUM (' || r.labels || '); END IF; END $do$;' || E'\n';
  END LOOP;

  out_sql := out_sql || E'\n-- ===== TABLES =====\n';
  FOR r IN
    SELECT c.relname AS tbl,
           (SELECT string_agg(
                     quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
                     || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), '')
                     || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
                     ', ' ORDER BY a.attnum)
              FROM pg_attribute a
              LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
             WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS cols
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
     ORDER BY c.relname
  LOOP
    out_sql := out_sql || 'CREATE TABLE IF NOT EXISTS public.' || quote_ident(r.tbl)
      || ' (' || r.cols || ');' || E'\n';
  END LOOP;

  out_sql := out_sql || E'\n-- ===== CONSTRAINTS =====\n';
  FOR r IN
    SELECT c.relname AS tbl, con.conname AS name, pg_get_constraintdef(con.oid) AS def,
           con.contype
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
     ORDER BY CASE con.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END, c.relname
  LOOP
    out_sql := out_sql || 'DO $do$ BEGIN ALTER TABLE public.' || quote_ident(r.tbl)
      || ' ADD CONSTRAINT ' || quote_ident(r.name) || ' ' || r.def
      || '; EXCEPTION WHEN duplicate_table OR duplicate_object OR invalid_table_definition THEN NULL; END $do$;' || E'\n';
  END LOOP;

  out_sql := out_sql || E'\n-- ===== INDEXES =====\n';
  FOR r IN
    SELECT indexdef FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname NOT IN (SELECT conname FROM pg_constraint)
     ORDER BY tablename, indexname
  LOOP
    out_sql := out_sql || replace(r.indexdef, 'CREATE INDEX', 'CREATE INDEX IF NOT EXISTS') || ';' || E'\n';
  END LOOP;

  out_sql := out_sql || E'\n-- ===== GRANTS & RLS =====\n';
  FOR r IN
    SELECT c.relname AS tbl
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname
  LOOP
    out_sql := out_sql || 'ALTER TABLE public.' || quote_ident(r.tbl) || ' ENABLE ROW LEVEL SECURITY;' || E'\n';
  END LOOP;
  FOR r IN
    SELECT table_name AS tbl, grantee, string_agg(DISTINCT privilege_type, ', ') AS privs
      FROM information_schema.role_table_grants
     WHERE table_schema = 'public' AND grantee IN ('anon','authenticated','service_role')
     GROUP BY table_name, grantee
     ORDER BY table_name, grantee
  LOOP
    out_sql := out_sql || 'GRANT ' || r.privs || ' ON public.' || quote_ident(r.tbl)
      || ' TO ' || quote_ident(r.grantee) || ';' || E'\n';
  END LOOP;

  out_sql := out_sql || E'\n-- ===== POLICIES =====\n';
  FOR r IN
    SELECT p.polname AS name, c.relname AS tbl, p.polcmd,
           pg_get_expr(p.polqual, p.polrelid) AS qual,
           pg_get_expr(p.polwithcheck, p.polrelid) AS wcheck,
           (SELECT string_agg(quote_ident(pg_get_userbyid(role_oid)), ', ')
              FROM unnest(p.polroles) AS role_oid
             WHERE pg_get_userbyid(role_oid) <> 'public') AS roles
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
     ORDER BY c.relname, p.polname
  LOOP
    out_sql := out_sql || 'DROP POLICY IF EXISTS ' || quote_ident(r.name) || ' ON public.' || quote_ident(r.tbl) || ';' || E'\n';
    out_sql := out_sql || 'CREATE POLICY ' || quote_ident(r.name) || ' ON public.' || quote_ident(r.tbl)
      || ' FOR ' || CASE r.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END
      || COALESCE(' TO ' || r.roles, '')
      || COALESCE(' USING (' || r.qual || ')', '')
      || COALESCE(' WITH CHECK (' || r.wcheck || ')', '')
      || ';' || E'\n';
  END LOOP;

  RETURN out_sql;
END $function$;

REVOKE ALL ON FUNCTION public.admin_dump_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_dump_schema() TO authenticated;