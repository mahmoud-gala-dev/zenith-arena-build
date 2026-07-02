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

/**
 * Resolve a manifest to a { srcSet, src } pair. Public paths become public URLs;
 * private paths get freshly signed URLs and are re-signed when close to expiry.
 */
export function useVariantSrcSet(manifest: ImageVariantsManifest | null | undefined): {
  srcSet: string;
  sizes: string;
  src: string;
} | null {
  const [state, setState] = useState<{ srcSet: string; sizes: string; src: string } | null>(null);
  const manifestKey = manifest ? JSON.stringify(manifest) : "";
  useEffect(() => {
    if (!manifest || !manifest.paths || Object.keys(manifest.paths).length === 0) {
      setState(null);
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
      setState({
        srcSet: parts.join(", "),
        sizes: "(min-width: 1024px) 50vw, 100vw",
        src: fallback,
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestKey]);
  return state;
}

export { parseSignedStorageUrl };
