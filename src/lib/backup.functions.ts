import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tables that must never be dumped/restored (transient or security noise). */
const EXCLUDED = new Set(["rate_limits"]);

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data: isSuper, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (error) throw new Error("Could not verify your permissions.");
  if (!isSuper) throw new Error("Forbidden: super admin role required.");
}

function quote(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  const escaped = text.replace(/'/g, "''");
  return typeof value === "object" ? `'${escaped}'::jsonb` : `'${escaped}'`;
}

/** List the public tables available for backup. */
export const listBackupTables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context as any);
    const { data, error } = await (context as any).supabase.rpc("admin_list_tables");
    if (error) throw new Error(error.message);
    const tables = ((data as string[] | null) ?? []).filter((t) => !EXCLUDED.has(t));
    return { tables };
  });

/** Build a complete SQL dump (data-only, with per-table TRUNCATE + INSERTs). */
export const exportDatabaseSql = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ tables: z.array(z.string().regex(/^[a-z0-9_]+$/)).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let tables = data.tables;
    if (!tables || tables.length === 0) {
      const { data: list, error } = await (context as any).supabase.rpc("admin_list_tables");
      if (error) throw new Error(error.message);
      tables = ((list as string[] | null) ?? []).filter((t) => !EXCLUDED.has(t));
    }
    tables = tables.filter((t) => !EXCLUDED.has(t));

    const lines: string[] = [
      "-- Egytic Sports — full data backup",
      `-- Generated: ${new Date().toISOString()}`,
      "-- Restore with the Backup & Restore page in /admin/backup",
      "BEGIN;",
      "SET session_replication_role = replica;",
      "",
    ];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      const rows: any[] = [];
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data: page, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .range(from, from + pageSize - 1);
        if (error) {
          lines.push(`-- SKIPPED ${table}: ${error.message}`);
          break;
        }
        rows.push(...(page ?? []));
        if (!page || page.length < pageSize) break;
      }
      counts[table] = rows.length;
      lines.push(`-- ===== ${table} (${rows.length} rows) =====`);
      lines.push(`TRUNCATE TABLE public.${table} CASCADE;`);
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const colList = cols.map((c) => `"${c}"`).join(", ");
        for (const row of rows) {
          const values = cols.map((c) => quote(row[c])).join(", ");
          lines.push(`INSERT INTO public.${table} (${colList}) VALUES (${values});`);
        }
      }
      lines.push("");
    }

    lines.push("SET session_replication_role = DEFAULT;", "COMMIT;", "");

    await (context as any).supabase.rpc("log_admin_event", {
      _action: "database_export",
      _table_name: "admin",
      _record_id: null,
      _changes: { tables: counts },
    });

    return { sql: lines.join("\n"), counts };
  });

/** Restore a SQL dump produced by exportDatabaseSql. */
export const importDatabaseSql = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sql: z.string().min(1).max(40_000_000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);

    const { error } = await (context as any).supabase.rpc("admin_exec_sql", { _sql: data.sql });
    if (error) throw new Error(error.message);

    await (context as any).supabase.rpc("log_admin_event", {
      _action: "database_import",
      _table_name: "admin",
      _record_id: null,
      _changes: { bytes: data.sql.length },
    });

    return { ok: true as const };
  });
