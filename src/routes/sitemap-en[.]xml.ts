import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildSitemapEntries, renderLangSitemap, resolveBaseUrl } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap-en.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = resolveBaseUrl(request);
        const entries = await buildSitemapEntries();
        return new Response(renderLangSitemap(entries, base, "en"), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
