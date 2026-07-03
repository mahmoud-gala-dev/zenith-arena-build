import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { services, projects, products, articles } from "@/lib/site-data";

const STATIC_PATHS = [
  "/", "/about", "/services", "/products", "/projects", "/knowledge",
  "/governorates", "/downloads", "/certificates", "/clients", "/gallery",
  "/faq", "/careers", "/contact", "/privacy", "/terms",
];

export interface SitemapEntry { path: string; lastmod?: string }

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...projects.map((p) => ({ path: `/projects/${p.slug}` })),
    ...products.map((p) => ({ path: `/products/${p.id}` })),
  ];
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const sb = url && key ? createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  try {
    if (sb) {
      const { data } = await sb.from("services").select("slug_en,updated_at").eq("status", "published");
      if (data?.length) for (const r of data) { if (r.slug_en) entries.push({ path: `/services/${r.slug_en}`, lastmod: r.updated_at ?? undefined }); }
      else for (const s of services) entries.push({ path: `/services/${s.id}` });
    } else for (const s of services) entries.push({ path: `/services/${s.id}` });
  } catch { for (const s of services) entries.push({ path: `/services/${s.id}` }); }
  try {
    if (sb) {
      const { data } = await sb.from("blog_posts").select("slug_en,updated_at,published_at").eq("status", "published");
      if (data?.length) for (const r of data) entries.push({ path: `/knowledge/${r.slug_en}`, lastmod: (r.updated_at ?? r.published_at) ?? undefined });
      else for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` });
    } else for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` });
  } catch { for (const a of articles) entries.push({ path: `/knowledge/${a.slug}` }); }
  return entries;
}

export function renderLangSitemap(entries: SitemapEntry[], baseUrl: string, lang: "en" | "ar"): string {
  const suffix = lang === "ar" ? "?lang=ar" : "";
  const urls = entries.map((e) => {
    const loc = `${baseUrl}${e.path}${suffix}`;
    const en = `${baseUrl}${e.path}`;
    const ar = `${baseUrl}${e.path}?lang=ar`;
    return [
      `  <url>`,
      `    <loc>${loc}</loc>`,
      e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
      `    <xhtml:link rel="alternate" hreflang="en" href="${en}" />`,
      `    <xhtml:link rel="alternate" hreflang="ar" href="${ar}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />`,
      `    <changefreq>weekly</changefreq>`,
      `  </url>`,
    ].filter(Boolean).join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

export function resolveBaseUrl(request: Request): string {
  const envBase = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${forwardedProto}://${forwardedHost}`;
}
