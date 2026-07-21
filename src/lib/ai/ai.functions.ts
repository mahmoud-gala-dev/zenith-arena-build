import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

type AISettings = {
  default_model: string;
  advanced_model: string;
  tone: string;
  glossary: Array<{ term: string; translation: string; note?: string }>;
  daily_user_limit: number;
  enabled: boolean;
};

async function loadSettings(supabase: any): Promise<AISettings> {
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    default_model: data?.default_model ?? DEFAULT_MODEL,
    advanced_model: data?.advanced_model ?? "google/gemini-3.1-pro-preview",
    tone: data?.tone ?? "professional",
    glossary: (data?.glossary as any) ?? [],
    daily_user_limit: data?.daily_user_limit ?? 200,
    enabled: data?.enabled ?? true,
  };
}

async function checkQuota(supabase: any, userId: string, limit: number) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= limit) {
    throw new Error(`Daily AI limit reached (${limit}/day). Try again tomorrow.`);
  }
}

async function logUsage(
  supabase: any,
  userId: string,
  action: string,
  model: string,
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined,
  durationMs: number,
  success: boolean,
  error?: string,
  target?: { table?: string; id?: string },
) {
  await supabase.from("ai_usage_logs").insert({
    user_id: userId,
    action,
    model,
    prompt_tokens: usage?.promptTokens ?? 0,
    completion_tokens: usage?.completionTokens ?? 0,
    total_tokens: usage?.totalTokens ?? 0,
    duration_ms: durationMs,
    success,
    error_message: error ?? null,
    target_table: target?.table ?? null,
    target_id: target?.id ?? null,
  });
}

function glossaryText(settings: AISettings) {
  if (!settings.glossary?.length) return "";
  const lines = settings.glossary
    .map((g) => `- "${g.term}" → "${g.translation}"${g.note ? ` (${g.note})` : ""}`)
    .join("\n");
  return `\n\nMandatory glossary — preserve exactly:\n${lines}`;
}

async function runModel(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
) {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const result = await generateText({
    model: gateway(model),
    system,
    prompt,
  });
  return {
    text: result.text,
    usage: {
      promptTokens: (result.usage as any)?.promptTokens ?? (result.usage as any)?.inputTokens,
      completionTokens: (result.usage as any)?.completionTokens ?? (result.usage as any)?.outputTokens,
      totalTokens: (result.usage as any)?.totalTokens,
    },
  };
}

async function assertPermission(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_permission", {
    _user_id: context.userId,
    _perm: "content.ai",
  });
  if (!data) throw new Error("Forbidden: missing content.ai permission");
}

/* ------------------------------------------------------------------ */
/* Generate content from a brief                                       */
/* ------------------------------------------------------------------ */
export const aiGenerateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        brief: z.string().min(3).max(4000),
        language: z.enum(["en", "ar"]).default("en"),
        kind: z
          .enum([
            "blog_post",
            "service_description",
            "project_story",
            "product_description",
            "generic",
            "seo_meta",
            "faq",
          ])
          .default("generic"),
        maxWords: z.number().int().min(20).max(2000).default(400),
        advanced: z.boolean().default(false),
        targetTable: z.string().optional(),
        targetId: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const settings = await loadSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");
    await checkQuota(context.supabase, context.userId, settings.daily_user_limit);

    const model = data.advanced ? settings.advanced_model : settings.default_model;
    const langLabel = data.language === "ar" ? "Arabic (فصحى معاصرة)" : "English";
    const system = `You are an expert content writer for "Egytic Sports", an Egyptian sports facility construction company (running tracks, football pitches, gyms, courts).
Tone: ${settings.tone}. Language: ${langLabel}. Content type: ${data.kind}.
Write clean prose (or Markdown when structure helps). Approx ${data.maxWords} words. Avoid clichés and filler.${glossaryText(settings)}`;

    const started = Date.now();
    try {
      const { text, usage } = await runModel(key, model, system, data.brief);
      await logUsage(
        context.supabase,
        context.userId,
        `generate:${data.kind}`,
        model,
        usage,
        Date.now() - started,
        true,
        undefined,
        { table: data.targetTable, id: data.targetId },
      );
      return { text, model };
    } catch (e: any) {
      await logUsage(
        context.supabase,
        context.userId,
        `generate:${data.kind}`,
        model,
        undefined,
        Date.now() - started,
        false,
        e?.message,
      );
      throw e;
    }
  });

/* ------------------------------------------------------------------ */
/* Translate                                                           */
/* ------------------------------------------------------------------ */
export const aiTranslate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().min(1).max(20000),
        from: z.enum(["en", "ar", "auto"]).default("auto"),
        to: z.enum(["en", "ar"]),
        preserveMarkdown: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const settings = await loadSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");
    await checkQuota(context.supabase, context.userId, settings.daily_user_limit);

    const toLabel = data.to === "ar" ? "Arabic (فصحى معاصرة)" : "English";
    const system = `You are a professional bilingual translator (English ↔ Arabic) for a sports construction company.
Translate the user's text into ${toLabel}. Preserve meaning, tone, and formatting.
${data.preserveMarkdown ? "Preserve Markdown, HTML tags, links, and lists exactly." : ""}
Do not add commentary. Return only the translated text.${glossaryText(settings)}`;

    const started = Date.now();
    const model = settings.default_model;
    try {
      const { text, usage } = await runModel(key, model, system, data.text);
      await logUsage(context.supabase, context.userId, `translate:${data.to}`, model, usage, Date.now() - started, true);
      return { text, model };
    } catch (e: any) {
      await logUsage(context.supabase, context.userId, `translate:${data.to}`, model, undefined, Date.now() - started, false, e?.message);
      throw e;
    }
  });

/* ------------------------------------------------------------------ */
/* Improve / rewrite / summarize                                       */
/* ------------------------------------------------------------------ */
export const aiImproveText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().min(1).max(20000),
        mode: z.enum(["improve", "shorten", "expand", "summarize", "fix_grammar", "seo_rewrite"]),
        language: z.enum(["en", "ar"]).default("en"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const settings = await loadSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");
    await checkQuota(context.supabase, context.userId, settings.daily_user_limit);

    const modeInstructions: Record<string, string> = {
      improve: "Rewrite for clarity, flow, and polish while keeping meaning.",
      shorten: "Cut redundancies. Keep the core message. Target ~60% of original length.",
      expand: "Add depth, specifics, and useful detail. Roughly 1.5–2x length.",
      summarize: "Produce a concise summary (2–4 sentences).",
      fix_grammar: "Fix grammar, spelling, punctuation. Do not change meaning or tone.",
      seo_rewrite: "Rewrite to be SEO-friendly: strong keywords, scannable, natural.",
    };
    const langLabel = data.language === "ar" ? "Arabic (فصحى معاصرة)" : "English";
    const system = `You are an expert copy editor. Language: ${langLabel}. Tone: ${settings.tone}.
Task: ${modeInstructions[data.mode]}
Preserve Markdown/HTML formatting. Return only the rewritten text — no preface or explanation.${glossaryText(settings)}`;

    const started = Date.now();
    const model = settings.default_model;
    try {
      const { text, usage } = await runModel(key, model, system, data.text);
      await logUsage(context.supabase, context.userId, `improve:${data.mode}`, model, usage, Date.now() - started, true);
      return { text, model };
    } catch (e: any) {
      await logUsage(context.supabase, context.userId, `improve:${data.mode}`, model, undefined, Date.now() - started, false, e?.message);
      throw e;
    }
  });

/* ------------------------------------------------------------------ */
/* SEO meta suggestion                                                 */
/* ------------------------------------------------------------------ */
export const aiGenerateSeo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        content: z.string().min(10).max(20000),
        language: z.enum(["en", "ar"]).default("en"),
        subject: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const settings = await loadSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");
    await checkQuota(context.supabase, context.userId, settings.daily_user_limit);

    const langLabel = data.language === "ar" ? "Arabic" : "English";
    const system = `You are an SEO expert. Language: ${langLabel}.
Return STRICT JSON only with keys: title (<=60 chars), description (<=155 chars), keywords (array of 5-8 short keywords), og_title, og_description.
No markdown, no code fences, no commentary. Just JSON.${glossaryText(settings)}`;
    const prompt = `${data.subject ? `Subject: ${data.subject}\n\n` : ""}Content:\n${data.content}`;

    const started = Date.now();
    const model = settings.default_model;
    try {
      const { text, usage } = await runModel(key, model, system, prompt);
      await logUsage(context.supabase, context.userId, "seo", model, usage, Date.now() - started, true);
      // strip code fences if any
      const clean = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      let parsed: any = {};
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = { title: "", description: "", keywords: [], og_title: "", og_description: "", raw: text };
      }
      return { seo: parsed, model };
    } catch (e: any) {
      await logUsage(context.supabase, context.userId, "seo", model, undefined, Date.now() - started, false, e?.message);
      throw e;
    }
  });

/* ------------------------------------------------------------------ */
/* Summarize a Lead + draft reply                                      */
/* ------------------------------------------------------------------ */
export const aiSummarizeLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ leadId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const settings = await loadSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");
    await checkQuota(context.supabase, context.userId, settings.daily_user_limit);

    const { data: lead, error } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .maybeSingle();
    if (error) throw error;
    if (!lead) throw new Error("Lead not found");

    const system = `You are a sales assistant for Egytic Sports. Return STRICT JSON with keys:
summary_en (2-3 sentences), summary_ar (2-3 sentences),
intent (one of: quote, info, complaint, spam, other),
priority (low|medium|high),
reply_en (short WhatsApp-friendly reply, warm and professional),
reply_ar (Arabic reply, same tone).
Only JSON. No fences.${glossaryText(settings)}`;
    const prompt = JSON.stringify(lead, null, 2);

    const started = Date.now();
    const model = settings.default_model;
    try {
      const { text, usage } = await runModel(key, model, system, prompt);
      await logUsage(context.supabase, context.userId, "lead_summary", model, usage, Date.now() - started, true, undefined, {
        table: "leads",
        id: data.leadId,
      });
      const clean = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      let parsed: any = {};
      try {
        parsed = JSON.parse(clean);
      } catch {
        parsed = { raw: text };
      }
      return { result: parsed, model };
    } catch (e: any) {
      await logUsage(context.supabase, context.userId, "lead_summary", model, undefined, Date.now() - started, false, e?.message);
      throw e;
    }
  });
