// Minimal SW that mirrors vite-plugin-pwa's contract:
//  - skipWaiting is NOT called on install → the new SW parks in `waiting`.
//  - Responds to postMessage({ type: 'SKIP_WAITING' }) by calling skipWaiting().
//  - Version marker is appended by the test harness on the "new" copy.

self.addEventListener("install", () => {
  // no self.skipWaiting() — wait for message from workbox-window.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", () => {
  // no-op — passthrough so the page keeps working.
});
