// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        // We already ship public/manifest.webmanifest — don't emit a second one.
        manifest: false,
        registerType: "autoUpdate",
        // Registration is owned by src/lib/pwa/register.ts (guarded wrapper).
        injectRegister: null,
        // Skill: never emit SW in dev / preview.
        devOptions: { enabled: false },
        strategies: "generateSW",
        includeAssets: [
          "icon.png",
          "icon-maskable.png",
          "apple-touch-icon.png",
          "manifest.webmanifest",
          "robots.txt",
          "offline.html",
        ],
        workbox: {
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/~oauth/,        // OAuth callback must never be intercepted
            /^\/auth\//,        // Supabase auth flows
            /^\/admin(\/|$)/,   // Admin shell relies on live data
            /^\/sitemap.*\.xml$/,
            /^\/robots\.txt$/,
            /\.[a-zA-Z0-9]+$/,  // static files
          ],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false, // controlled from workbox-window
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              // HTML navigations — always try network first, fall back to cache/offline.html.
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "html-nav",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              // Same-origin hashed build assets — safe to serve cache-first.
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\/_build\//.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "build-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // Google Fonts (files come from fontsource in-repo, but leave a safe rule).
              urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\//,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts" },
            },
            {
              // Lovable CDN assets (images, logos, etc.)
              urlPattern: /\/__l5e\/assets-v1\//,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "cdn-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              // Supabase Storage public objects (product & project images).
              urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "supabase-storage",
                expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 14 },
              },
            },
          ],
        },
      }),
    ],
  },
});
