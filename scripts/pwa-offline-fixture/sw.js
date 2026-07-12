// Minimal SW mirroring the production runtimeCaching rules in vite.config.ts:
//   - NetworkFirst for `request.mode === 'navigate'`, timeout 4s.
//   - Precache offline.html + known routes so cache-first fallback works when
//     the network drops (matches Workbox `navigateFallback: '/offline.html'`).

const CACHE = "html-nav-v1";
const PRECACHE = ["/", "/index.html", "/about.html", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

async function networkFirstNavigate(request) {
  const cache = await caches.open(CACHE);
  try {
    const network = await Promise.race([
      fetch(request),
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 4000)),
    ]);
    if (network && network.ok) {
      cache.put(request, network.clone()).catch(() => {});
      return network;
    }
    throw new Error("bad response");
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match("/offline.html");
    if (fallback) return fallback;
    return new Response("offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(networkFirstNavigate(req));
  }
});
