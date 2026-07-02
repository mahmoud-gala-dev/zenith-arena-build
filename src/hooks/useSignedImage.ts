import { useEffect, useState } from "react";
import { refreshIfExpiring, signPaths, parseSignedStorageUrl } from "@/lib/signedUrl";

export type ImageVariantsManifest = {
  bucket: string;
  /** Map of width → storage path, e.g. { "480": "services/x-480.webp" } */
  paths: Record<string, string>;
  format?: "webp" | "avif" | "jpeg";
};

/** Return an always-fresh URL for a possibly-signed image. Public URLs pass through unchanged. */
export function useSignedImage(url: string | null | undefined): string | null {
  const [resolved, setResolved] = useState<string | null>(url ?? null);
  useEffect(() => {
    if (!url) { setResolved(null); return; }
    let cancelled = false;
    (async () => {
      const fresh = await refreshIfExpiring(url);
      if (!cancelled) setResolved(fresh);
    })();
    return () => { cancelled = true; };
  }, [url]);
  return resolved;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Module-level cache for resolved manifests.
 * Avoids re-signing storage paths on every render / route revisit within TTL.
 * Keyed by `${bucket}::${sortedPathsJson}`. Entries expire before signed TTL.
 * ────────────────────────────────────────────────────────────────────────── */

type CachedEntry = { data: { srcSet: string; sizes: string; src: string }; expiresAt: number };
const manifestCache = new Map<string, CachedEntry>();
/** Cache entries for 3 days. Signed URLs are minted for 7 days, so we always
 *  have a comfortable buffer before they'd need to be re-signed. */
const MANIFEST_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function cacheKey(m: ImageVariantsManifest): string {
  const sortedPaths = Object.entries(m.paths).sort(([a], [b]) => (a < b ? -1 : 1));
  return `${m.bucket}::${JSON.stringify(sortedPaths)}`;
}

/** Clear the in-memory manifest cache. Exposed for admin actions after replacing an image. */
export function invalidateManifestCache(m?: ImageVariantsManifest | null) {
  if (!m) { manifestCache.clear(); return; }
  manifestCache.delete(cacheKey(m));
}

/**
 * Resolve a manifest to a { srcSet, src } pair. Public paths become public URLs;
 * private paths get freshly signed URLs and are re-signed when close to expiry.
 * Memoized in-memory to avoid re-signing on repeat navigations.
 */
export function useVariantSrcSet(manifest: ImageVariantsManifest | null | undefined): {
  srcSet: string;
  sizes: string;
  src: string;
} | null {
  const key = manifest ? cacheKey(manifest) : "";
  // Warm from cache synchronously so first paint is instant on revisit.
  const initial = (() => {
    if (!key) return null;
    const hit = manifestCache.get(key);
    return hit && hit.expiresAt > Date.now() ? hit.data : null;
  })();
  const [state, setState] = useState<{ srcSet: string; sizes: string; src: string } | null>(initial);

  useEffect(() => {
    if (!manifest || !manifest.paths || Object.keys(manifest.paths).length === 0) {
      setState(null);
      return;
    }
    const hit = manifestCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      setState(hit.data);
      return;
    }
    let cancelled = false;
    (async () => {
      const paths = Object.values(manifest.paths);
      const signed = await signPaths(manifest.bucket, paths);
      if (cancelled) return;
      const parts: string[] = [];
      let fallback = "";
      let widest = 0;
      for (const [w, path] of Object.entries(manifest.paths)) {
        const url = signed[path];
        if (!url) continue;
        const width = Number(w);
        parts.push(`${url} ${width}w`);
        if (width > widest) { widest = width; fallback = url; }
      }
      const data = {
        srcSet: parts.join(", "),
        sizes: "(min-width: 1024px) 50vw, 100vw",
        src: fallback,
      };
      manifestCache.set(key, { data, expiresAt: Date.now() + MANIFEST_CACHE_TTL_MS });
      setState(data);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

export { parseSignedStorageUrl };
