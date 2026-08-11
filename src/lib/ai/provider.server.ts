import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type AiProviderName = "lovable" | "gemini";

export type AiRuntimeSettings = {
  provider: AiProviderName;
  default_model: string;
  advanced_model: string;
  gemini_model: string;
  gemini_rotate_keys: boolean;
  tone: string;
  glossary: Array<{ term: string; translation: string; note?: string }>;
  daily_user_limit: number;
  enabled: boolean;
};

export const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";

export const DEFAULT_LOVABLE_MODEL = "google/gemini-3-flash-preview";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

export type AiKeyRow = {
  id: string;
  label: string;
  api_key: string;
  active: boolean;
  priority: number;
};

/** Service-role client, loaded lazily so this never leaks into a client bundle. */
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    from: (t: string) => any;
  };
}

export async function loadAiSettings(supabase: any): Promise<AiRuntimeSettings> {
  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    provider: (data?.provider as AiProviderName) ?? "lovable",
    default_model: data?.default_model ?? DEFAULT_LOVABLE_MODEL,
    advanced_model: data?.advanced_model ?? "google/gemini-3.1-pro-preview",
    gemini_model: data?.gemini_model ?? DEFAULT_GEMINI_MODEL,
    gemini_rotate_keys: data?.gemini_rotate_keys ?? true,
    tone: data?.tone ?? "professional",
    glossary: (data?.glossary as AiRuntimeSettings["glossary"]) ?? [],
    daily_user_limit: data?.daily_user_limit ?? 200,
    enabled: data?.enabled ?? true,
  };
}

/** Active Gemini keys, highest priority first. */
export async function loadGeminiKeys(): Promise<AiKeyRow[]> {
  const db = await admin();
  const { data } = await db
    .from("ai_api_keys")
    .select("id,label,api_key,active,priority")
    .eq("provider", "gemini")
    .eq("active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });
  return (data ?? []) as AiKeyRow[];
}

async function markKeyStatus(id: string, ok: boolean, error?: string) {
  try {
    const db = await admin();
    await db
      .from("ai_api_keys")
      .update({
        last_status: ok ? "ok" : "error",
        last_error: ok ? null : (error ?? "Unknown error").slice(0, 500),
        last_tested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch {
    /* non-fatal */
  }
}

export function geminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: GEMINI_OPENAI_BASE_URL,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export type AiTextResult = {
  text: string;
  model: string;
  provider: AiProviderName;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

function normalizeUsage(usage: unknown) {
  const u = (usage ?? {}) as Record<string, number | undefined>;
  return {
    promptTokens: u.promptTokens ?? u.inputTokens,
    completionTokens: u.completionTokens ?? u.outputTokens,
    totalTokens: u.totalTokens,
  };
}

/**
 * Runs a text generation against the configured provider.
 * Gemini mode tries each stored key in priority order (rotation/failover).
 */
export async function runAiText(opts: {
  settings: AiRuntimeSettings;
  system: string;
  prompt: string;
  advanced?: boolean;
}): Promise<AiTextResult> {
  const { settings, system, prompt } = opts;

  if (settings.provider === "gemini") {
    const keys = await loadGeminiKeys();
    if (!keys.length) {
      throw new Error(
        "No active Google Gemini API keys configured. Add one in Admin → AI, or switch the provider back to Lovable AI.",
      );
    }
    const pool = settings.gemini_rotate_keys ? keys : keys.slice(0, 1);
    let lastError: unknown = null;
    for (const key of pool) {
      try {
        const result = await generateText({
          model: geminiProvider(key.api_key)(settings.gemini_model),
          system,
          prompt,
        });
        void markKeyStatus(key.id, true);
        return {
          text: result.text,
          model: settings.gemini_model,
          provider: "gemini",
          usage: normalizeUsage(result.usage),
        };
      } catch (e) {
        lastError = e;
        await markKeyStatus(key.id, false, e instanceof Error ? e.message : String(e));
      }
    }
    throw new Error(
      `All Gemini keys failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  const model = opts.advanced ? settings.advanced_model : settings.default_model;
  const gateway = createLovableAiGatewayProvider(lovableKey);
  const result = await generateText({ model: gateway(model), system, prompt });
  return {
    text: result.text,
    model,
    provider: "lovable",
    usage: normalizeUsage(result.usage),
  };
}

/** Lightweight connectivity probe for a single Gemini key. */
export async function testGeminiKey(apiKey: string, model: string) {
  const started = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
    },
  );
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${body.slice(0, 300)}`);
  }
  return { latencyMs: Date.now() - started };
}
