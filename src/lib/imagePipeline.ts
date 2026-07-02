import { supabase } from "@/integrations/supabase/client";
import { signPaths, DEFAULT_SIGNED_TTL, signPath } from "@/lib/signedUrl";
import type { ImageVariantsManifest } from "@/hooks/useSignedImage";

/** Widths generated for responsive srcset. */
export const VARIANT_WIDTHS = [480, 960, 1600] as const;

export type CropRect = { x: number; y: number; width: number; height: number };

/** Crop a source blob/file to `cropPx` (source pixel coordinates) and return a new blob. */
export async function cropImage(source: Blob, cropPx: CropRect, mime = "image/jpeg", quality = 0.92): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cropPx.width);
  canvas.height = Math.round(cropPx.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close?.(); throw new Error("Canvas 2D unavailable"); }
  ctx.drawImage(
    bitmap,
    cropPx.x, cropPx.y, cropPx.width, cropPx.height,
    0, 0, canvas.width, canvas.height,
  );
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality),
  );
}

/** Resize a blob down to `targetWidth` (keeping aspect) and encode as WebP. */
export async function resizeToWebp(source: Blob, targetWidth: number, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(source);
  const ratio = bitmap.height / bitmap.width;
  const w = Math.min(targetWidth, bitmap.width);
  const h = Math.round(w * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close?.(); throw new Error("Canvas 2D unavailable"); }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("WebP encoding failed"))), "image/webp", quality),
  );
}

export type UploadResult = {
  /** URL of the largest rendition — used as the primary/legacy image field. */
  primaryUrl: string;
  /** Manifest of all rendition paths (for building srcset). */
  manifest: ImageVariantsManifest;
};

/**
 * Upload cropped original + WebP variants to Storage. Falls back to signed URLs when
 * the bucket is private. Returns primary URL + manifest ready to store in JSONB column.
 */
export async function uploadImageWithVariants(
  cropped: Blob,
  opts: { bucket: string; folder?: string; baseName?: string; widths?: readonly number[] },
): Promise<UploadResult> {
  const bucket = opts.bucket;
  const folder = (opts.folder ?? "").replace(/^\/+|\/+$/g, "");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = (opts.baseName ?? stamp).replace(/[^a-z0-9-]/gi, "").slice(0, 40) || stamp;
  const prefix = folder ? `${folder}/${base}-${stamp}` : `${base}-${stamp}`;
  const widths = opts.widths ?? VARIANT_WIDTHS;

  // Encode variants in parallel.
  const encoded = await Promise.all(
    widths.map(async (w) => ({ w, blob: await resizeToWebp(cropped, w) })),
  );

  const uploads = encoded.map(async ({ w, blob }) => {
    const path = `${prefix}-${w}.webp`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: "image/webp",
      cacheControl: "31536000, immutable",
      upsert: false,
    });
    if (error) throw error;
    return [w, path] as const;
  });
  const entries = await Promise.all(uploads);
  const paths: Record<string, string> = Object.fromEntries(entries.map(([w, p]) => [String(w), p]));

  // Resolve URL for the widest variant → primary URL.
  const widest = String(Math.max(...entries.map(([w]) => w)));
  const widestPath = paths[widest];

  let primaryUrl = "";
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(widestPath);
  if (pub?.publicUrl) {
    const head = await fetch(pub.publicUrl, { method: "HEAD" }).catch(() => null);
    if (head?.ok) primaryUrl = pub.publicUrl;
  }
  if (!primaryUrl) {
    primaryUrl = await signPath(bucket, widestPath, DEFAULT_SIGNED_TTL);
  }

  return {
    primaryUrl,
    manifest: { bucket, paths, format: "webp" },
  };
}

/** Read a File as an object URL that must be revoked when done. */
export function fileToObjectUrl(file: Blob): string {
  return URL.createObjectURL(file);
}

export { signPaths };
