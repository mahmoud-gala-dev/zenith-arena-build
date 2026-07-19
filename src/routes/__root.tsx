import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { SmoothScroll } from "../components/site/SmoothScroll";
import { PerfOverlay } from "../components/site/PerfOverlay";
import { initPerf } from "../lib/perf";
import { PwaController } from "../components/site/PwaController";
import { seoDefaultsQueryOptions, DEFAULT_SEO_DEFAULTS } from "../lib/settings";



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
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
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
        { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
        { rel: "mask-icon", href: "/icon.svg", color: "#12b981" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
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
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    initPerf();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SmoothScroll />
        <PerfOverlay />
        <PwaController />

        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

