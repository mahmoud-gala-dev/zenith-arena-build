import { supabase } from "@/integrations/supabase/client";

export type AdminAuditAction =
  | "PERMISSION_DENIED"
  | "SENSITIVE_CHANGE"
  | "LOGIN"
  | "LOGOUT";

export interface AdminAuditPayload {
  action: AdminAuditAction | string;
  /** Logical resource / table the event targets. */
  resource: string;
  /** Optional id of the affected record. */
  recordId?: string | null;
  /** Extra structured context (permission key, route, before/after diff, …). */
  details?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget audit logger for the admin surface. Writes to `audit_logs`
 * via the `log_admin_event` SECURITY DEFINER RPC so the row is stamped with
 * the current auth.uid() and email on the server side. Errors are swallowed
 * so instrumentation never breaks the calling flow.
 */
export async function logAdminAudit(payload: AdminAuditPayload): Promise<void> {
  try {
    const changes = payload.details
      ? { details: payload.details }
      : null;
    await supabase.rpc("log_admin_event", {
      _action: payload.action,
      _table_name: payload.resource,
      _record_id: payload.recordId ?? null,
      _changes: changes,
    });
  } catch {
    // best-effort — never surface logging failures to the user
  }
}
