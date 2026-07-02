import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { services, projects, products, articles } from "@/lib/site-data";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

const STATIC_PATHS = [
  "/", "/about", "/services", "/products", "/projects", "/knowledge",
  "/governorates", "/downloads", "/certificates", "/clients", "/gallery",
  "/faq", "/careers", "/contact", "/quote", "/privacy", "/terms",
];

interface Entry { path: string; lastmod?: string }

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [
          ...STATIC_PATHS.map((path) => ({ path })),
          ...services.map((s) => ({ path: `/services/${s.id}` })),
          ...projects.map((p) => ({ path: `/projects/${p.slug}` })),
          ...products.map((p) => ({ path: `/products/${p.id}` })),
        ];

        // Live blog posts from Cloud so admin edits reach crawlers on next fetch.
        try {
          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (url && key) {
            const sb = createClient<Database>(url, key, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            });
            const { data } = await sb
              .from("blog_posts")
              .select("slug_en,updated_at,published_at")
              .eq("status", "published");
            if (data && data.length) {
              for (const row of data) {
                entries.push({
                  path: `/knowledge/${row.slug_en}`,
                  lastmod: (row.updated_at ?? row.published_at ?? undefined) as string | undefined,
                });
              }
            } else {
              for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` });
            }
          } else {
            for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` });
          }
        } catch {
          for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` });
        }

        const urls = entries.map((e) => {
          const loc = `${BASE_URL}${e.path}`;
          return [
            `  <url>`,
            `    <loc>${loc}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            `    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />`,
            `    <xhtml:link rel="alternate" hreflang="ar" href="${loc}" />`,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`,
            `    <changefreq>weekly</changefreq>`,
            `  </url>`,
          ].filter(Boolean).join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=600",
          },
        });
      },
    },
  },
});
