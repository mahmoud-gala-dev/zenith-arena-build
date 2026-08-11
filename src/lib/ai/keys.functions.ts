import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { testGeminiKey, DEFAULT_GEMINI_MODEL } from "@/lib/ai/provider.server";

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!data) throw new Error("Forbidden: super_admin only");
}

function mask(key: string) {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export const aiKeysList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { data, error } = await context.supabase
      .from("ai_api_keys")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((k: any) => ({
      id: k.id as string,
      provider: k.provider as string,
      label: k.label as string,
      masked: mask(k.api_key as string),
      active: k.active as boolean,
      priority: k.priority as number,
      last_status: (k.last_status ?? null) as string | null,
      last_error: (k.last_error ?? null) as string | null,
      last_tested_at: (k.last_tested_at ?? null) as string | null,
    }));
  });

export const aiKeySave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        label: z.string().min(1).max(80),
        api_key: z.string().min(10).max(400).optional(),
        active: z.boolean().default(true),
        priority: z.number().int().min(0).max(100).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const patch = {
      label: data.label,
      active: data.active,
      priority: data.priority,
      provider: "gemini",
      updated_at: new Date().toISOString(),
      ...(data.api_key ? { api_key: data.api_key.trim() } : {}),
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("ai_api_keys")
        .update(patch)
        .eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const newKey = data.api_key?.trim();
    if (!newKey) throw new Error("An API key value is required");
    const { data: row, error } = await context.supabase
      .from("ai_api_keys")
      .insert({ ...patch, api_key: newKey })
      .select("id")
      .single();
    if (error) throw error;
    return { id: row.id as string };
  });

export const aiKeyDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { error } = await context.supabase.from("ai_api_keys").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const aiKeyTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        api_key: z.string().min(10).optional(),
        model: z.string().min(2).default(DEFAULT_GEMINI_MODEL),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    let key = data.api_key?.trim();
    if (!key && data.id) {
      const { data: row, error } = await context.supabase
        .from("ai_api_keys")
        .select("api_key")
        .eq("id", data.id)
        .maybeSingle();
      if (error) throw error;
      key = row?.api_key as string | undefined;
    }
    if (!key) throw new Error("No key to test");

    try {
      const { latencyMs } = await testGeminiKey(key, data.model);
      if (data.id) {
        await context.supabase
          .from("ai_api_keys")
          .update({ last_status: "ok", last_error: null, last_tested_at: new Date().toISOString() })
          .eq("id", data.id);
      }
      return { ok: true as const, latencyMs };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (data.id) {
        await context.supabase
          .from("ai_api_keys")
          .update({
            last_status: "error",
            last_error: message.slice(0, 500),
            last_tested_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }
      return { ok: false as const, error: message };
    }
  });
