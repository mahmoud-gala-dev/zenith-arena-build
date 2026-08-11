import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * External CDN configuration — optional image/asset delivery layer in front of
 * the built-in Lovable CDN (/__l5e/assets-v1/...) and Supabase storage URLs.
 */

export type CdnProvider = "none" | "bunny" | "cloudflare" | "cloudinary" | "imgix" | "custom";

export type CdnConfig = {
  provider: CdnProvider;
  /** e.g. https://egytic.b-cdn.net */
  base_url: string;
  /** Rewrite site asset URLs through the CDN base URL on the public site. */
  enabled: boolean;
  /** Optional query appended to rewritten URLs, e.g. "width=1600&quality=80" */
  transform_query: string;
  /** Path used by the connectivity test, e.g. /__l5e/assets-v1/<id>/photo.jpg */
  test_path: string;
};

const DEFAULT: CdnConfig = {
  provider: "none",
  base_url: "",
  enabled: false,
  transform_query: "",
  test_path: "",
};

const Schema = z.object({
  provider: z.enum(["none", "bunny", "cloudflare", "cloudinary", "imgix", "custom"]),
  base_url: z.string().url().or(z.literal("")),
  enabled: z.boolean(),
  transform_query: z.string().max(300),
  test_path: z.string().max(500),
});

export const getCdnConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("settings")
      .select("value")
      .eq("key", "integrations_cdn")
      .maybeSingle();
    return { ...DEFAULT, ...((data?.value as Partial<CdnConfig>) ?? {}) } as CdnConfig;
  });

export const saveCdnConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => Schema.parse(raw))
  .handler(async ({ context, data }) => {
    if (data.enabled && !data.base_url) throw new Error("Base URL is required to enable the CDN");
    const { error } = await context.supabase
      .from("settings")
      .upsert({ key: "integrations_cdn", value: data, is_public: true }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Fetch a single URL and report status, latency, cache and size headers. */
export const testCdnUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ url: z.string().url() }).parse(raw))
  .handler(async ({ data }) => {
    const started = Date.now();
    try {
      const res = await fetch(data.url, { method: "GET", headers: { accept: "*/*" } });
      const buf = await res.arrayBuffer();
      return {
        ok: res.ok,
        status: res.status,
        duration_ms: Date.now() - started,
        content_type: res.headers.get("content-type") ?? "",
        cache_status:
          res.headers.get("cf-cache-status") ??
          res.headers.get("x-cache") ??
          res.headers.get("cdn-cache") ??
          res.headers.get("age") ??
          "",
        bytes: buf.byteLength,
        error: "",
      };
    } catch (e) {
      return {
        ok: false,
        status: 0,
        duration_ms: Date.now() - started,
        content_type: "",
        cache_status: "",
        bytes: 0,
        error: e instanceof Error ? e.message : "Request failed",
      };
    }
  });
