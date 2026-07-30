import { QueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { SmoothScroll } from "../components/site/SmoothScroll";
import { PerfOverlay } from "../components/site/PerfOverlay";
import { initPerf } from "../lib/perf";
import { PwaController } from "../components/site/PwaController";
import { seoDefaultsQueryOptions, DEFAULT_SEO_DEFAULTS } from "../lib/settings";
import { GlobalErrorFallback } from "../components/site/GlobalErrorFallback";
import { AppErrorBoundary } from "../components/site/AppErrorBoundary";



import "@fontsource/sora/400.css";
import "@fontsource/sora/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/700.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/700.css";

import { NotFound } from "../components/site/NotFound";

function NotFoundComponent() {
  return <NotFound showCode withLayout={false} />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  return <GlobalErrorFallback error={error} reset={reset} boundary="tanstack_root" />;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async ({ context, location }) => {
    const langParam = (location.search as { lang?: string })?.lang;
    const lang = langParam === "ar" ? "ar" : "en";
    try {
      const seo = await context.queryClient.ensureQueryData(seoDefaultsQueryOptions);
      return { seo, lang };
    } catch {
      return { seo: DEFAULT_SEO_DEFAULTS, lang };
    }
  },
  head: ({ loaderData }) => {
    const seo = loaderData?.seo ?? DEFAULT_SEO_DEFAULTS;
    const title = seo.default_title_en;
    const description = seo.default_description_en;
    const siteName = seo.site_name_en;
    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title },
      { name: "description", content: description },
      { name: "author", content: seo.author },
      { property: "og:site_name", content: siteName },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "theme-color", content: seo.theme_color },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: siteName },
      { name: "application-name", content: siteName },
      { name: "msapplication-TileColor", content: seo.theme_color },
      { name: "msapplication-TileImage", content: "/icon.png?v=2" },
      { name: "msapplication-config", content: "/browserconfig.xml" },
    ];
    if (seo.twitter_handle) {
      meta.push({ name: "twitter:site", content: seo.twitter_handle });
      meta.push({ name: "twitter:creator", content: seo.twitter_handle });
    }
    if (seo.default_og_image_url) {
      meta.push({ property: "og:image", content: seo.default_og_image_url });
      meta.push({ name: "twitter:image", content: seo.default_og_image_url });
    }
    return {
      meta,
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://phimnzbiqssakrepavik.supabase.co", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://phimnzbiqssakrepavik.supabase.co" },
        { rel: "icon", href: "/icon.png?v=2", type: "image/png", media: "(prefers-color-scheme: light)" },
        { rel: "icon", href: "/icon-dark.png?v=2", type: "image/png", media: "(prefers-color-scheme: dark)" },
        { rel: "manifest", href: "/manifest.webmanifest", media: "(prefers-color-scheme: light)" },
        { rel: "manifest", href: "/manifest-dark.webmanifest", media: "(prefers-color-scheme: dark)" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2", media: "(prefers-color-scheme: light)" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon-dark.png?v=2", media: "(prefers-color-scheme: dark)" },
        { rel: "mask-icon", href: "/mask-icon.svg", color: seo.theme_color },
        { rel: "shortcut icon", href: "/icon.png?v=2", type: "image/png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const loaderData = Route.useLoaderData();
  const lang = loaderData?.lang ?? "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    <html lang={lang} dir={dir}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { lang } = Route.useLoaderData();

  useEffect(() => {
    initPerf();
  }, []);

  return (
    <LanguageProvider initialLang={lang === "ar" ? "ar" : "en"}>
      <SmoothScroll />
      <PerfOverlay />
      <PwaController />

      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppErrorBoundary boundary="root_outlet">
        <Outlet />
      </AppErrorBoundary>
    </LanguageProvider>
  );
}

