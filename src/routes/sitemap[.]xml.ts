import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { services, projects, products, articles } from "@/lib/site-data";

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
        const dynamic = [
          ...services.map((s) => `/services/${s.id}`),
          ...projects.map((p) => `/projects/${p.slug}`),
          ...products.map((p) => `/products/${p.id}`),
          ...articles.map((a) => `/knowledge/${a.slug}`),
        ];

        const paths = [...STATIC_PATHS, ...dynamic];

        const urls = paths.map((p) => {
          const loc = `${BASE_URL}${p}`;
          return [
            `  <url>`,
            `    <loc>${loc}</loc>`,
            `    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />`,
            `    <xhtml:link rel="alternate" hreflang="ar" href="${loc}" />`,
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`,
            `    <changefreq>weekly</changefreq>`,
            `  </url>`,
          ].join("\n");
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
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
