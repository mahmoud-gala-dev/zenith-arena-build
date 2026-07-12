import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, number[]>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

const schema = z.object({
  email: z.string().trim().email().max(255),
  locale: z.enum(["en", "ar"]).optional(),
  source: z.string().trim().max(80).optional(),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const req = getRequest();
    const ip =
      req?.headers.get("cf-connecting-ip") ||
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!rateLimitOk(ip)) throw new Error("Too many requests. Please try again shortly.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { website: _hp, ...payload } = data;
    void _hp;
    const email = payload.email.toLowerCase();
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        {
          email,
          locale: payload.locale ?? "en",
          source: payload.source ?? "footer",
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: "email" },
      );
    if (error) {
      console.error("[subscribeNewsletter]", error);
      throw new Error("Could not subscribe. Please try again.");
    }
    return { ok: true as const };
  });
