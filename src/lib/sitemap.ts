import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const STATIC_PATHS = [
  "/", "/about", "/services", "/products", "/projects", "/knowledge",
  "/governorates", "/downloads", "/certificates", "/clients", "/gallery",
  "/faq", "/careers", "/contact", "/privacy", "/terms",
];

/**
 * A sitemap entry may carry its own bilingual alternates. When `alternates`
 * is set, the renderer uses those absolute-ish paths for hreflang instead of
 * derivating them by appending `?lang=ar` to `path`. This lets us honor
 * `translation_group_id` on blog posts where the AR variant lives under a
 * different slug (its own row).
 */
export interface SitemapEntry {
  path: string;
  lastmod?: string;
  lang?: "en" | "ar";
  alternates?: { en: string; ar: string };
}

const hasArabic = (s: string | null | undefined) => !!s && /[\u0600-\u06FF]/.test(s);

type BlogRow = {
  slug_en: string;
  slug_ar: string | null;
  updated_at: string | null;
  published_at: string | null;
  content_en: string | null;
  content_ar: string | null;
  translation_group_id: string | null;
};

/**
 * Given all rows sharing a `translation_group_id`, decide which row represents
 * the EN variant and which represents the AR variant.
 * Rules:
 *  - Prefer a row with non-empty content_en (and non-Arabic slug) for EN.
 *  - Prefer a different row with non-empty content_ar (or Arabic slug) for AR.
 *  - If only one row exists, EN uses `/knowledge/slug_en` and AR falls back
 *    to `?lang=ar` on the same slug.
 */
function pickGroupUrls(group: BlogRow[]): {
  enPath: string;
  arPath: string;
  enRow: BlogRow;
  arRow: BlogRow;
  sameRow: boolean;
} {
  const enRow =
    group.find((r) => r.content_en && !hasArabic(r.slug_en)) ?? group[0];
  const arRow =
    group.find(
      (r) => r !== enRow && (r.content_ar || hasArabic(r.slug_en) || r.slug_ar),
    ) ?? enRow;
  const enPath = `/knowledge/${enRow.slug_en}`;
  const arPath =
    arRow === enRow
      ? `/knowledge/${enRow.slug_en}?lang=ar`
      : `/knowledge/${arRow.slug_en}`;
  return { enPath, arPath, enRow, arRow, sameRow: arRow === enRow };
}

export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = STATIC_PATHS.map((path) => ({ path }));
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const sb = url && key
    ? createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  if (!sb) return entries;

  const [services, posts, projects, products] = await Promise.all([
    sb.from("services").select("slug_en,updated_at").eq("status", "published"),
    sb
      .from("blog_posts")
      .select("slug_en,slug_ar,updated_at,published_at,content_en,content_ar,translation_group_id")
      .eq("status", "published"),
    sb.from("projects").select("slug_en,updated_at").eq("status", "published"),
    sb.from("products").select("slug_en,updated_at").eq("status", "published"),
  ]);

  for (const r of services.data ?? []) if (r.slug_en) entries.push({ path: `/services/${r.slug_en}`, lastmod: r.updated_at ?? undefined });
  for (const r of projects.data ?? []) if (r.slug_en) entries.push({ path: `/projects/${r.slug_en}`, lastmod: r.updated_at ?? undefined });
  for (const r of products.data ?? []) if (r.slug_en) entries.push({ path: `/products/${r.slug_en}`, lastmod: r.updated_at ?? undefined });

  // Group blog posts by translation_group_id and emit one URL per language,
  // with hreflang alternates pointing at the actual sibling URLs.
  const rows = (posts.data ?? []) as BlogRow[];
  const groups = new Map<string, BlogRow[]>();
  for (const r of rows) {
    if (!r.slug_en) continue;
    const key = r.translation_group_id || `__solo:${r.slug_en}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  for (const group of groups.values()) {
    const { enPath, arPath, enRow, arRow, sameRow } = pickGroupUrls(group);
    const alternates = { en: enPath, ar: arPath };
    entries.push({
      path: enPath,
      lang: "en",
      lastmod: (enRow.updated_at ?? enRow.published_at) ?? undefined,
      alternates,
    });
    if (!sameRow) {
      entries.push({
        path: arPath,
        lang: "ar",
        lastmod: (arRow.updated_at ?? arRow.published_at) ?? undefined,
        alternates,
      });
    }
  }

  return entries;
}

export function renderLangSitemap(entries: SitemapEntry[], baseUrl: string, lang: "en" | "ar"): string {
  // Filter for this language sitemap. Entries with an explicit `lang` (blog
  // posts we grouped) belong only to that sitemap; all other entries appear
  // in both, with `?lang=ar` appended on the Arabic side.
  const filtered = entries.filter((e) => !e.lang || e.lang === lang);
  const urls = filtered.map((e) => {
    let loc: string;
    let enHref: string;
    let arHref: string;
    if (e.alternates) {
      loc = `${baseUrl}${lang === "ar" ? e.alternates.ar : e.alternates.en}`;
      enHref = `${baseUrl}${e.alternates.en}`;
      arHref = `${baseUrl}${e.alternates.ar}`;
    } else {
      const suffix = lang === "ar" ? "?lang=ar" : "";
      loc = `${baseUrl}${e.path}${suffix}`;
      enHref = `${baseUrl}${e.path}`;
      arHref = `${baseUrl}${e.path}?lang=ar`;
    }
    return [
      `  <url>`,
      `    <loc>${loc}</loc>`,
      e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
      `    <xhtml:link rel="alternate" hreflang="en" href="${enHref}" />`,
      `    <xhtml:link rel="alternate" hreflang="ar" href="${arHref}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${enHref}" />`,
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

/**
 * Compute per-language alternates from a set of rows in a translation group.
 * Callers own the fetch (SSR uses the server client; route loaders use the
 * shared browser client) — this helper is pure.
 */
export function alternatesFromGroup(
  group: Array<Pick<BlogRow, "slug_en" | "slug_ar" | "content_en" | "content_ar">>,
  fallbackSlugEn: string,
): { en: string; ar: string } {
  if (group.length === 0) {
    return {
      en: `/knowledge/${fallbackSlugEn}`,
      ar: `/knowledge/${fallbackSlugEn}?lang=ar`,
    };
  }
  const full = group.map((r) => ({
    slug_en: r.slug_en,
    slug_ar: r.slug_ar,
    content_en: r.content_en,
    content_ar: r.content_ar,
    updated_at: null,
    published_at: null,
    translation_group_id: null,
  })) as BlogRow[];
  const { enPath, arPath } = pickGroupUrls(full);
  return { en: enPath, ar: arPath };
}
