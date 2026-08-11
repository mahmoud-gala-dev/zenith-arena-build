import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const TABLES = ["services", "products", "projects", "blog_posts"] as const;
type SeoTable = (typeof TABLES)[number];

const SEO_TITLE_COLS: Record<SeoTable, string> = {
  services: "seo_title_en",
  products: "seo_title_en",
  projects: "seo_title_en",
  blog_posts: "seo_title_en",
};
const SEO_DESC_COLS: Record<SeoTable, string> = {
  services: "seo_description_en",
  products: "seo_description_en",
  projects: "seo_description_en",
  blog_posts: "seo_description_en",
};

async function runAutoSeo(
  supabaseClient: any,
  apiKey: string,
  opts: { table?: SeoTable; limit?: number },
) {
  const tables: SeoTable[] = opts.table ? [opts.table] : [...TABLES];
  const limit = opts.limit ?? 10;
  const gateway = createLovableAiGatewayProvider(apiKey);
  const modelId = "google/gemini-3-flash-preview";
  const model = gateway(modelId);
  let processed = 0;
  const details: Array<{ table: string; id: string; ok: boolean; error?: string }> = [];

  for (const table of tables) {
    const titleCol = SEO_TITLE_COLS[table];
    const descCol = SEO_DESC_COLS[table];
    const { data, error } = await supabaseClient
      .from(table)
      .select(
        "id, title_en, name_en, description_en, excerpt_en, content_en, " +
          titleCol +
          ", " +
          descCol,
      )
      .or(`${titleCol}.is.null,${descCol}.is.null`)
      .limit(limit);
    if (error) {
      details.push({ table, id: "-", ok: false, error: error.message });
      continue;
    }
    for (const row of (data as any[]) ?? []) {
      const subject = row.title_en ?? row.name_en ?? "Egytic Sports";
      const body = row.excerpt_en ?? row.description_en ?? row.content_en ?? subject;
      const prompt = `Subject: ${subject}\n\nContent: ${String(body).slice(0, 4000)}`;
      try {
        const result = await generateText({
          model,
          system: `You are an SEO expert. Return STRICT JSON: {"title": "<=60 chars", "description": "<=155 chars"}. No fences, no commentary.`,
          prompt,
        });
        const clean = result.text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
        const parsed = JSON.parse(clean);
        const patch: Record<string, string> = {};
        if (!row[titleCol] && parsed.title) patch[titleCol] = String(parsed.title).slice(0, 60);
        if (!row[descCol] && parsed.description)
          patch[descCol] = String(parsed.description).slice(0, 155);
        if (Object.keys(patch).length) {
          const { error: upErr } = await supabaseClient.from(table).update(patch).eq("id", row.id);
          if (upErr) {
            details.push({ table, id: row.id, ok: false, error: upErr.message });
            continue;
          }
        }
        processed++;
        details.push({ table, id: row.id, ok: true });
      } catch (e: any) {
        details.push({ table, id: row.id, ok: false, error: e?.message ?? String(e) });
      }
    }
  }
  return { processed, details };
}

/** Admin-triggered auto-SEO (uses caller's Supabase client with RLS). */
export const aiAutoSeoRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        table: z.enum(TABLES).optional(),
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _perm: "content.ai",
    });
    if (!allowed) throw new Error("Forbidden: missing content.ai permission");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const result = await runAutoSeo(context.supabase, key, data);
    await context.supabase.from("ai_usage_logs").insert({
      user_id: context.userId,
      action: "auto_seo_manual",
      model: "google/gemini-3-flash-preview",
      success: true,
      total_tokens: 0,
      duration_ms: 0,
    });
    return result;
  });

export { runAutoSeo };
