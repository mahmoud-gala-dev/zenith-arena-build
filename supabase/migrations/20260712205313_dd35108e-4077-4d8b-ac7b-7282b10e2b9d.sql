DROP TRIGGER IF EXISTS leads_audit_trigger ON public.leads;
CREATE TRIGGER leads_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_audit();