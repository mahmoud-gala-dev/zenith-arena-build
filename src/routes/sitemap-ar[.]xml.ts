import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { buildEntries, renderLangSitemap } from "./sitemap-en[.]xml";

function resolveBaseUrl(request: Request): string {
  const envBase = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host") ?? url.host;
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${forwardedProto}://${forwardedHost}`;
}

export const Route = createFileRoute("/sitemap-ar.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const base = resolveBaseUrl(request);
        const entries = await buildEntries();
        return new Response(renderLangSitemap(entries, base, "ar"), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600" },
        });
      },
    },
  },
});
