import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Mint a fresh short-lived signed URL for a published download.
 * Never exposes the underlying storage path or a long-lived link.
 */
export const getDownloadSignedUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ downloadId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("downloads")
      .select("id, file_url, status")
      .eq("id", data.downloadId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row || row.status !== "published" || !row.file_url) {
      throw new Error("Download not available");
    }

    // Try to parse a Supabase Storage URL (sign or public form) to extract bucket + path.
    let bucket: string | null = null;
    let path: string | null = null;
    try {
      const u = new URL(row.file_url);
      const m = u.pathname.match(
        /\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/(.+)$/,
      );
      if (m) {
        bucket = decodeURIComponent(m[1]);
        path = decodeURIComponent(m[2]);
      }
    } catch {
      /* stored value is not a URL — treat as opaque */
    }

    // External / third-party URL: pass through unchanged.
    if (!bucket || !path) {
      return { url: row.file_url };
    }

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, 60, { download: true });

    if (sErr || !signed?.signedUrl) {
      throw new Error(sErr?.message || "Failed to sign download URL");
    }
    return { url: signed.signedUrl };
  });
