
-- Restore EXECUTE on role-check functions (SECURITY DEFINER, safe to expose;
-- they only return booleans and are referenced by every public read policy).
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Allow staff to fully manage qa_reports from the admin panel.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qa_reports TO authenticated;
CREATE POLICY "Staff can manage qa_reports"
  ON public.qa_reports
  FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
