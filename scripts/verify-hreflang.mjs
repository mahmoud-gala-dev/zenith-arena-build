#!/usr/bin/env node
/**
 * Cross-validates hreflang alternates emitted from route <head> tags against
 * the sitemap.xml output. Prevents drift between per-route SEO and the sitemap.
 *
 * Usage:  BASE_URL=https://example.com node scripts/verify-hreflang.mjs
 * Exit 0 = OK, exit 1 = mismatches found.
 */
import { XMLParser } from "fast-xml-parser";

const BASE = (process.env.BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function extractHreflangs(html) {
  const out = new Map();
  const re = /<link\s+[^>]*rel=["']alternate["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  const langRe = /hreflang=["']([^"']+)["']/i;
  for (const tag of html.match(re) ?? []) {
    const href = tag.match(hrefRe)?.[1];
    const lang = tag.match(langRe)?.[1];
    if (href && lang) out.set(lang, href);
  }
  return out;
}

async function main() {
  const sitemapXml = await fetchText(`${BASE}/sitemap.xml`);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(sitemapXml);
  const urls = Array.isArray(parsed?.urlset?.url) ? parsed.urlset.url : [parsed?.urlset?.url].filter(Boolean);

  const sitemapMap = new Map();
  for (const u of urls) {
    const loc = u?.loc;
    const alts = Array.isArray(u?.["xhtml:link"]) ? u["xhtml:link"] : [u?.["xhtml:link"]].filter(Boolean);
    const langs = new Map();
    for (const a of alts) {
      const l = a?.["@_hreflang"];
      const h = a?.["@_href"];
      if (l && h) langs.set(l, h);
    }
    if (loc) sitemapMap.set(loc, langs);
  }

  const mismatches = [];
  for (const [loc, langs] of sitemapMap) {
    let html;
    try { html = await fetchText(loc); }
    catch (e) { mismatches.push({ loc, error: String(e) }); continue; }
    const head = extractHreflangs(html);
    for (const [lang, href] of langs) {
      if (head.get(lang) !== href) {
        mismatches.push({ loc, lang, sitemap: href, head: head.get(lang) ?? "(missing)" });
      }
    }
  }

  if (mismatches.length) {
    console.error("❌ hreflang mismatches:");
    for (const m of mismatches) console.error("  ", JSON.stringify(m));
    process.exit(1);
  }
  console.log(`✅ Verified ${sitemapMap.size} URLs — hreflang alternates match sitemap.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
