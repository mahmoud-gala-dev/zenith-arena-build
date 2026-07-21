import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * n8n integration — outbound (site → n8n → social) & config.
 * Inbound webhook lives at /api/public/hooks/n8n-inbound.
 */

export type N8nConfig = {
  outbound_webhook_url: string;
  enabled: boolean;
  auto_publish_blog: boolean;
};

const DEFAULT: N8nConfig = {
  outbound_webhook_url: "",
  enabled: false,
  auto_publish_blog: false,
};

/** Read integration config (staff only). */
export const getN8nConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations_n8n")
      .maybeSingle();
    return { ...DEFAULT, ...((data?.value as Partial<N8nConfig>) ?? {}) } as N8nConfig;
  });

/** Save integration config (staff only). */
export const saveN8nConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        outbound_webhook_url: z.string().url().or(z.literal("")),
        enabled: z.boolean(),
        auto_publish_blog: z.boolean(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("settings")
      .upsert(
        { key: "integrations_n8n", value: data, is_public: false },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PayloadSchema = z.object({
  event: z.enum(["blog.published", "test", "manual"]).default("manual"),
  language: z.enum(["en", "ar"]).default("en"),
  title: z.string(),
  excerpt: z.string().optional().default(""),
  url: z.string().url(),
  image_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  content_type: z.string().optional().default("article"),
  slug: z.string().optional().default(""),
  post_id: z.string().optional().default(""),
});

/** Fire the outbound webhook. Staff only. */
export const sendN8nOutbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PayloadSchema.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations_n8n")
      .maybeSingle();
    const cfg = { ...DEFAULT, ...((row?.value as Partial<N8nConfig>) ?? {}) };
    if (!cfg.enabled) throw new Error("Integration disabled");
    if (!cfg.outbound_webhook_url) throw new Error("Outbound webhook URL not set");

    const started = Date.now();
    const res = await fetch(cfg.outbound_webhook_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, sent_at: new Date().toISOString() }),
    });
    const text = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      duration_ms: Date.now() - started,
      response: text.slice(0, 500),
    };
  });
