import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { services, projects, products, articles } from "@/lib/site-data";

function resolveBaseUrl(request: Request): string {
  const envBase = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${forwardedProto}://${forwardedHost}`;
}


const STATIC_PATHS = [
  "/", "/about", "/services", "/products", "/projects", "/knowledge",
  "/governorates", "/downloads", "/certificates", "/clients", "/gallery",
  "/faq", "/careers", "/contact", "/quote", "/privacy", "/terms",
];

interface Entry { path: string; lastmod?: string }

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const BASE_URL = resolveBaseUrl(request);

        const entries: Entry[] = [
          ...STATIC_PATHS.map((path) => ({ path })),
          ...projects.map((p) => ({ path: `/projects/${p.slug}` })),
          ...products.map((p) => ({ path: `/products/${p.id}` })),
        ];

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        const sb = url && key
          ? createClient<Database>(url, key, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            })
          : null;

        // Live services from Cloud so admin edits reach crawlers on next fetch.
        try {
          if (sb) {
            const { data } = await sb
              .from("services")
              .select("slug_en,updated_at")
              .eq("status", "published");
            if (data && data.length) {
              for (const row of data) {
                if (!row.slug_en) continue;
                entries.push({
                  path: `/services/${row.slug_en}`,
                  lastmod: (row.updated_at ?? undefined) as string | undefined,
                });
              }
            } else {
              for (const s of services) entries.push({ path: `/services/${s.id}` });
            }
          } else {
            for (const s of services) entries.push({ path: `/services/${s.id}` });
          }
        } catch {
          for (const s of services) entries.push({ path: `/services/${s.id}` });
        }

        // Live blog posts from Cloud so admin edits reach crawlers on next fetch.
        try {
          if (sb) {
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
          const arLoc = `${loc}?lang=ar`;
          return [
            `  <url>`,
            `    <loc>${loc}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            `    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />`,
            `    <xhtml:link rel="alternate" hreflang="ar" href="${arLoc}" />`,
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
