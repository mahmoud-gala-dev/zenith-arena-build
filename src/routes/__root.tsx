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
import { LanguageProvider } from "../i18n/LanguageProvider";
import { SmoothScroll } from "../components/site/SmoothScroll";
import { PerfOverlay } from "../components/site/PerfOverlay";
import { initPerf } from "../lib/perf";
import { PwaController } from "../components/site/PwaController";



import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      {
        title: "Egytic — Sports Construction & Infrastructure",
      },
      {
        name: "description",
        content:
          "Egytic Sports designs and builds FIFA-grade football pitches, World Athletics tracks, indoor arenas, courts and aquatic centers. Turnkey sports infrastructure engineered to last.",
      },
      { name: "author", content: "Egytic Sports Infrastructure" },
      { property: "og:title", content: "Egytic — Sports Construction & Infrastructure" },
      {
        property: "og:description",
        content:
          "Egytic Sports designs and builds FIFA-grade football pitches, World Athletics tracks, indoor arenas, courts and aquatic centers. Turnkey sports infrastructure engineered to last.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b0f19" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Egytic" },
      { name: "twitter:title", content: "Egytic — Sports Construction & Infrastructure" },
      { name: "twitter:description", content: "Egytic Sports designs and builds FIFA-grade football pitches, World Athletics tracks, indoor arenas, courts and aquatic centers. Turnkey sports infrastructure engineered to last." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f71b7f40-6781-48c9-a005-9a671759e2cd/id-preview-6612edba--d6c67e6e-f41c-480e-8a57-28a93a2e36b1.lovable.app-1783068660044.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f71b7f40-6781-48c9-a005-9a671759e2cd/id-preview-6612edba--d6c67e6e-f41c-480e-8a57-28a93a2e36b1.lovable.app-1783068660044.png" },
    ],



    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://phimnzbiqssakrepavik.supabase.co", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://phimnzbiqssakrepavik.supabase.co" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "mask-icon", href: "/icon.svg", color: "#12b981" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],

  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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

