import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(20000),
});

/**
 * Non-streaming admin chat assistant.
 * Injects a site snapshot as context so the model can answer questions about
 * leads, projects, services, etc.
 */
export const aiAdminChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(60),
        language: z.enum(["en", "ar"]).default("en"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // permission check
    const { data: allowed } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _perm: "content.ai",
    });
    if (!allowed) throw new Error("Forbidden: missing content.ai permission");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // ------- gather live site snapshot -------
    const supabase = context.supabase;
    const [leadsAgg, servicesAgg, projectsAgg, blogAgg, recentLeads, recentBlog] =
      await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact" }),
        supabase.from("services").select("id, status", { count: "exact" }),
        supabase.from("projects").select("id, status", { count: "exact" }),
        supabase.from("blog_posts").select("id, status", { count: "exact" }),
        supabase
          .from("leads")
          .select("name, phone, service_interest, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("blog_posts")
          .select("title_en, status, published_at")
          .order("updated_at", { ascending: false })
          .limit(10),
      ]);

    const snapshot = {
      totals: {
        leads: leadsAgg.count ?? 0,
        services: servicesAgg.count ?? 0,
        projects: projectsAgg.count ?? 0,
        blog_posts: blogAgg.count ?? 0,
      },
      leads_by_status: countBy((leadsAgg.data ?? []) as Array<{ status?: string }>, "status"),
      recent_leads: recentLeads.data ?? [],
      recent_blog: recentBlog.data ?? [],
    };

    const langLabel = data.language === "ar" ? "Arabic (فصحى معاصرة)" : "English";
    const system = `You are the internal AI assistant for the Egytic Sports admin dashboard.
You help staff manage a sports construction company website (services, projects, products, downloads, leads, blog, gallery).
Reply in ${langLabel}. Keep answers short, actionable, and specific to the site data below.
Use markdown when it improves clarity (lists, headings, tables). Never invent stats — if unsure, say so.

LIVE SITE SNAPSHOT (JSON):
${JSON.stringify(snapshot, null, 2)}`;

    const gateway = createLovableAiGatewayProvider(key);
    const modelId = "google/gemini-3-flash-preview";

    const modelMessages: ModelMessage[] = data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const started = Date.now();
    try {
      const result = await generateText({
        model: gateway(modelId),
        system,
        messages: modelMessages,
      });
      await supabase.from("ai_usage_logs").insert({
        user_id: context.userId,
        action: "admin_chat",
        model: modelId,
        prompt_tokens: (result.usage as any)?.inputTokens ?? 0,
        completion_tokens: (result.usage as any)?.outputTokens ?? 0,
        total_tokens: (result.usage as any)?.totalTokens ?? 0,
        duration_ms: Date.now() - started,
        success: true,
      });
      return { text: result.text, model: modelId };
    } catch (e: any) {
      await supabase.from("ai_usage_logs").insert({
        user_id: context.userId,
        action: "admin_chat",
        model: modelId,
        duration_ms: Date.now() - started,
        success: false,
        error_message: e?.message ?? String(e),
      });
      throw e;
    }
  });

function countBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  const out: Record<string, number> = {};
  rows.forEach((r) => {
    const k = String(r[key] ?? "unknown");
    out[k] = (out[k] ?? 0) + 1;
  });
  return out;
}
