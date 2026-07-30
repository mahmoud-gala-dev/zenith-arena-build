import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(72)
  .refine((v) => /[a-z]/.test(v), "Must contain a lowercase letter")
  .refine((v) => /[A-Z]/.test(v), "Must contain an uppercase letter")
  .refine((v) => /[0-9]/.test(v), "Must contain a digit")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Must contain a symbol");

/**
 * Rotate any user's password. Replaces the old, publicly reachable
 * `/api/public/hooks/reset-admin-pw` endpoint: the caller must be signed in AND
 * hold the `super_admin` role, verified server-side through the user's own
 * (RLS-scoped) client before any privileged client is loaded.
 */
export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), password: passwordSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (roleErr) {
      console.error("[setUserPassword] role check failed", roleErr);
      throw new Error("Could not verify your permissions.");
    }
    if (!isSuper) throw new Error("Forbidden: super admin role required.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      console.error("[setUserPassword] update failed", error.message);
      throw new Error("Could not update the password.");
    }

    // Audit trail (never records the password itself).
    await context.supabase.rpc("log_admin_event", {
      _action: "password_reset",
      _table_name: "auth.users",
      _record_id: data.userId,
      _changes: { summary: "Password rotated by super admin" },
    });

    return { ok: true as const };
  });
