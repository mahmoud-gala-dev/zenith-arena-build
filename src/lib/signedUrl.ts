import { supabase } from "@/integrations/supabase/client";

/** Refresh window: re-sign when a signed URL has less than this many seconds left. */
export const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 2; // 2 days
/** Default TTL for newly minted signed URLs (7 days is enough for browser cache but safe). */
export const DEFAULT_SIGNED_TTL = 60 * 60 * 24 * 7;

export type ParsedSignedUrl = {
  bucket: string;
  path: string;
  /** Unix ms when the token expires, or null if we couldn't determine. */
  expiresAtMs: number | null;
};

/**
 * Parse a Supabase Storage signed URL.
 * Matches:  /storage/v1/object/sign/{bucket}/{path}?token=...
 * Returns null for public or non-Supabase URLs.
 */
export function parseSignedStorageUrl(url: string): ParsedSignedUrl | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Path shape: /storage/v1/object/sign/<bucket>/<...path>
    const m = u.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/);
    if (!m) return null;
    const bucket = decodeURIComponent(m[1]);
    const path = decodeURIComponent(m[2]);

    // Try to decode the JWT-ish token payload to read `exp`.
    let expiresAtMs: number | null = null;
    const token = u.searchParams.get("token");
    if (token && token.split(".").length === 3) {
      try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = JSON.parse(json) as { exp?: number };
        if (typeof parsed.exp === "number") expiresAtMs = parsed.exp * 1000;
      } catch {
        /* ignore */
      }
    }
    return { bucket, path, expiresAtMs };
  } catch {
    return null;
  }
}

/** Mint a fresh signed URL for a known bucket/path. */
export async function signPath(bucket: string, path: string, ttl = DEFAULT_SIGNED_TTL): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttl);
  if (error || !data?.signedUrl) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

/**
 * If `url` is a signed Supabase URL nearing expiry, mint a fresh one.
 * Otherwise return the original URL unchanged (public URLs, third-party CDNs).
 */
export async function refreshIfExpiring(url: string, ttl = DEFAULT_SIGNED_TTL): Promise<string> {
  const parsed = parseSignedStorageUrl(url);
  if (!parsed) return url;
  if (parsed.expiresAtMs && parsed.expiresAtMs - Date.now() > REFRESH_THRESHOLD_SECONDS * 1000) {
    return url;
  }
  try {
    return await signPath(parsed.bucket, parsed.path, ttl);
  } catch {
    return url; // fall back to the stale URL rather than break the image
  }
}

/** Sign many paths in one bucket in parallel. */
export async function signPaths(
  bucket: string,
  paths: string[],
  ttl = DEFAULT_SIGNED_TTL,
): Promise<Record<string, string>> {
  const results = await Promise.all(
    paths.map(async (p) => [p, await signPath(bucket, p, ttl).catch(() => "")] as const),
  );
  return Object.fromEntries(results.filter(([, v]) => v));
}
