import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

function resolveBaseUrl(request: Request): string {
  const envBase = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${forwardedProto}://${forwardedHost}`;
}

// Root sitemap.xml → sitemap index pointing to per-language sitemaps.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const BASE_URL = resolveBaseUrl(request);
        const now = new Date().toISOString();
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          `  <sitemap><loc>${BASE_URL}/sitemap-en.xml</loc><lastmod>${now}</lastmod></sitemap>`,
          `  <sitemap><loc>${BASE_URL}/sitemap-ar.xml</loc><lastmod>${now}</lastmod></sitemap>`,
          `</sitemapindex>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
