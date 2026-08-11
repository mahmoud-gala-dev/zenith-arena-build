import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loadAiSettings, loadGeminiKeys } from "@/lib/ai/provider.server";

const LOVABLE_IMAGE_MODEL = "google/gemini-3-pro-image";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

const DEFAULT_PROMPT =
  "Enhance this photograph of a sports facility for use as a website hero/cover image: " +
  "increase sharpness and perceived resolution, fix exposure and white balance, deepen but keep natural colours, " +
  "remove noise and compression artefacts, straighten horizon. Keep the exact same scene, framing and content — " +
  "do not add, remove or invent any objects, people, logos or text.";

async function assertPermission(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_permission", {
    _user_id: context.userId,
    _perm: "content.ai",
  });
  if (!data) throw new Error("Forbidden: missing content.ai permission");
}

async function fetchAsBase64(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download the source image (${res.status})`);
  const type = res.headers.get("content-type") ?? "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i += 8192) {
    binary += String.fromCharCode(...buf.subarray(i, i + 8192));
  }
  return { base64: btoa(binary), mime: type.split(";")[0] };
}

function extractDataUrl(payload: any): string | null {
  // Lovable gateway (OpenAI-compatible) shape
  const msg = payload?.choices?.[0]?.message;
  const fromImages = msg?.images?.[0]?.image_url?.url;
  if (typeof fromImages === "string") return fromImages;
  if (typeof msg?.content === "string" && msg.content.startsWith("data:image")) return msg.content;

  // Gemini native shape
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part?.inlineData ?? part?.inline_data;
    if (inline?.data) {
      return `data:${inline.mimeType ?? inline.mime_type ?? "image/png"};base64,${inline.data}`;
    }
  }
  return null;
}

export const aiEnhanceImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        imageUrl: z.string().url(),
        instructions: z.string().max(1200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertPermission(context);
    const settings = await loadAiSettings(context.supabase);
    if (!settings.enabled) throw new Error("AI assistant is disabled");

    const prompt = data.instructions?.trim()
      ? `${DEFAULT_PROMPT}\n\nExtra instructions: ${data.instructions.trim()}`
      : DEFAULT_PROMPT;
    const { base64, mime } = await fetchAsBase64(data.imageUrl);

    if (settings.provider === "gemini") {
      const keys = await loadGeminiKeys();
      if (!keys.length) throw new Error("No active Google Gemini API keys configured.");
      let lastError = "";
      for (const key of keys) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`,
          {
            method: "POST",
            headers: { "x-goog-api-key": key.api_key, "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }, { inlineData: { mimeType: mime, data: base64 } }],
                },
              ],
            }),
          },
        );
        const body = await res.text();
        if (!res.ok) {
          lastError = `[${res.status}] ${body.slice(0, 300)}`;
          continue;
        }
        const url = extractDataUrl(JSON.parse(body));
        if (url) return { dataUrl: url, model: GEMINI_IMAGE_MODEL, provider: "gemini" as const };
        lastError = "The model returned no image.";
      }
      throw new Error(`Gemini image enhancement failed: ${lastError}`);
    }

    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Lovable-API-Key": lovableKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOVABLE_IMAGE_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Image enhancement failed [${res.status}]: ${body.slice(0, 300)}`);
    const url = extractDataUrl(JSON.parse(body));
    if (!url) throw new Error("The model returned no image.");
    return { dataUrl: url, model: LOVABLE_IMAGE_MODEL, provider: "lovable" as const };
  });
