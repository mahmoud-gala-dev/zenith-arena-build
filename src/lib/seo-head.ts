/**
 * Reusable head-builder for public routes that consume seo_settings rows.
 * Keeps all route metadata under admin control instead of hardcoded strings.
 */
import type { SeoSettingsRow } from "@/lib/queries";

const SITE_URL = "https://zenith-arena-build.lovable.app";

export type SeoHeadOptions = {
  /** Route path used for canonical/og:url fallbacks, e.g. "/about". */
  routePath: string;
  /** SEO settings row from `seoSettingsByRouteQueryOptions` (may be null). */
  seo: SeoSettingsRow | null;
  /** English defaults used when the DB row is missing. */
  fallbackTitleEn: string;
  fallbackTitleAr: string;
  fallbackDescEn: string;
  fallbackDescAr: string;
  /** Optional additional JSON-LD scripts (e.g. FAQPage). */
  extraJsonLd?: Array<Record<string, unknown>>;
  /** Optional additional link tags (e.g. LCP preload). */
  extraLinks?: Array<Record<string, string>>;
  /** Optional additional meta entries. */
  extraMeta?: Array<Record<string, string>>;
};

export function buildSeoHead(opts: SeoHeadOptions) {
  const {
    routePath,
    seo,
    fallbackTitleEn,
    fallbackTitleAr,
    fallbackDescEn,
    fallbackDescAr,
    extraJsonLd = [],
    extraLinks = [],
    extraMeta = [],
  } = opts;

  const titleEn = seo?.meta_title_en || fallbackTitleEn;
  const titleAr = seo?.meta_title_ar || fallbackTitleAr;
  const descEn = seo?.meta_description_en || fallbackDescEn;
  const descAr = seo?.meta_description_ar || fallbackDescAr;
  const ogTitle = seo?.og_title_en || titleEn;
  const ogDesc = seo?.og_description_en || descEn;
  const ogImage = seo?.og_image || null;
  const twitterImage = seo?.twitter_image || ogImage;
  const canonical = seo?.canonical_url || `${SITE_URL}${routePath}`;
  const robotsIndex = seo?.robots_index ?? true;
  const robotsFollow = seo?.robots_follow ?? true;
  const robotsContent = `${robotsIndex ? "index" : "noindex"},${robotsFollow ? "follow" : "nofollow"}`;

  const meta: Array<Record<string, string>> = [
    { title: `${titleEn} | ${titleAr}` },
    { name: "description", content: `${descEn} — ${descAr}` },
    { name: "robots", content: robotsContent },
    ...(seo?.keywords ? [{ name: "keywords", content: seo.keywords }] : []),
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Egytic Sports" },
    { property: "og:url", content: canonical },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDesc },
    { property: "og:locale", content: "en_US" },
    { property: "og:locale:alternate", content: "ar_EG" },
    ...(ogImage
      ? [
          { property: "og:image", content: ogImage },
          { property: "og:image:alt", content: ogTitle },
        ]
      : []),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDesc },
    ...(twitterImage ? [{ name: "twitter:image", content: twitterImage }] : []),
    ...extraMeta,
  ];

  const links: Array<Record<string, string>> = [
    { rel: "canonical", href: canonical },
    { rel: "alternate", hrefLang: "en", href: `${SITE_URL}${routePath}` },
    { rel: "alternate", hrefLang: "ar", href: `${SITE_URL}${routePath}?lang=ar` },
    { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${routePath}` },
    ...extraLinks,
  ];

  const scripts = [
    ...(seo?.schema_type
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": seo.schema_type,
              name: ogTitle,
              description: ogDesc,
              url: canonical,
            }),
          },
        ]
      : []),
    ...extraJsonLd.map((obj) => ({
      type: "application/ld+json",
      children: JSON.stringify(obj),
    })),
  ];

  return { meta, links, scripts };
}
