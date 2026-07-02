import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

const STATIC_PATHS = [
  "/", "/about", "/services", "/products", "/projects", "/knowledge",
  "/downloads", "/certificates", "/clients", "/gallery", "/faq",
  "/careers", "/contact", "/quote", "/privacy", "/terms",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const dynamic: string[] = [];
        try {
          const [services, projects, products, blog] = await Promise.all([
            supabase.from("services").select("slug"),
            supabase.from("projects").select("slug"),
            supabase.from("products").select("slug"),
            supabase.from("blog_posts").select("slug"),
          ]);
          services.data?.forEach((r) => r.slug && dynamic.push(`/services/${r.slug}`));
          projects.data?.forEach((r) => r.slug && dynamic.push(`/projects/${r.slug}`));
          products.data?.forEach((r) => r.slug && dynamic.push(`/products/${r.slug}`));
          blog.data?.forEach((r) => r.slug && dynamic.push(`/knowledge/${r.slug}`));
        } catch {
          // fall back to static-only sitemap if DB unreachable
        }

        const paths = [...STATIC_PATHS, ...dynamic];
        const urls = paths.map(
          (p) => `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`,
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
