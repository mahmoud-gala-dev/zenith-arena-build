import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Inbound webhook — receives posts from n8n (Facebook/Instagram/LinkedIn/Telegram)
 * and stores them as DRAFT blog posts for editorial review.
 *
 * Auth: shared secret in header `x-n8n-secret` matching env `N8N_INBOUND_SECRET`.
 */

const Schema = z.object({
  title_en: z.string().min(2).optional(),
  title_ar: z.string().min(2).optional(),
  content_en: z.string().optional().default(""),
  content_ar: z.string().optional().default(""),
  excerpt_en: z.string().optional().default(""),
  excerpt_ar: z.string().optional().default(""),
  featured_image: z.string().url().optional().nullable(),
  source: z.string().optional().default("facebook"),
  source_url: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  content_type: z.enum(["article", "guide", "case_study"]).optional().default("article"),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;
}

export const Route = createFileRoute("/api/public/hooks/n8n-inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.N8N_INBOUND_SECRET;
        if (!secret) {
          return Response.json({ error: "Server not configured" }, { status: 500 });
        }
        const provided = request.headers.get("x-n8n-secret") ?? "";
        if (provided !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = Schema.safeParse(raw);
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const p = parsed.data;

        const title_en = p.title_en?.trim() || p.title_ar?.trim() || "Untitled";
        const title_ar = p.title_ar?.trim() || p.title_en?.trim() || "بدون عنوان";
        const base = slugify(title_en);
        const slug_en = `${base}-${Date.now().toString(36)}`;
        const slug_ar = `${slugify(title_ar) || base}-${Date.now().toString(36)}`;

        const tagsWithSource = Array.from(new Set([...(p.tags ?? []), `source:${p.source}`]));

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("blog_posts")
          .insert({
            title_en,
            title_ar,
            slug_en,
            slug_ar,
            excerpt_en: p.excerpt_en,
            excerpt_ar: p.excerpt_ar,
            content_en: p.content_en,
            content_ar: p.content_ar,
            featured_image: p.featured_image ?? null,
            tags: tagsWithSource,
            content_type: p.content_type,
            status: "draft",
            author_name: `n8n · ${p.source}`,
          })
          .select("id, slug_en")
          .single();

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
          ok: true,
          id: data.id,
          slug_en: data.slug_en,
          status: "draft",
          message: "Post saved as draft for editorial review",
        });
      },
      GET: async () =>
        Response.json({
          ok: true,
          endpoint: "n8n-inbound",
          method: "POST",
          headers_required: ["x-n8n-secret", "content-type: application/json"],
        }),
    },
  },
});
