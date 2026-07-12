
CREATE OR REPLACE FUNCTION public.log_admin_event(
  _action text,
  _table_name text,
  _record_id text DEFAULT NULL,
  _changes jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = v_actor;
  EXCEPTION WHEN OTHERS THEN v_email := NULL; END;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, table_name, record_id, changes)
  VALUES (v_actor, v_email, _action, COALESCE(_table_name, 'admin'), _record_id, _changes)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_event(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_admin_event(text, text, text, jsonb) TO authenticated;
