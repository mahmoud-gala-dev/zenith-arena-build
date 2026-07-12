/**
 * PWA registration wrapper — the ONLY place that registers /sw.js.
 *
 * Guards (per Lovable PWA skill):
 * - Never in dev / non-production builds.
 * - Never inside an iframe (the Lovable editor previews the app in one).
 * - Never on Lovable preview / project / staging / beta hosts.
 * - `?sw=off` kill switch: unregisters any matching /sw.js and skips.
 *
 * In every refused context we still unregister an existing /sw.js so a
 * previously-installed service worker cannot keep serving stale HTML.
 */

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    // Cross-origin frame access throws — treat as iframed.
    return true;
  }
  const { hostname, search } = window.location;
  if (search.includes("sw=off")) return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterMatching(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* noop */
  }
}

export type PwaUpdateHandler = (opts: { updateAndReload: () => Promise<void> }) => void;

export async function registerPwa(onUpdateAvailable?: PwaUpdateHandler): Promise<void> {
  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }
  if (!("serviceWorker" in navigator)) return;

  const { Workbox } = await import("workbox-window");
  const wb = new Workbox(SW_URL, { scope: "/" });

  const updateAndReload = async () => {
    await new Promise<void>((resolve) => {
      wb.addEventListener("controlling", () => resolve(), { once: true });
      wb.messageSkipWaiting();
    });
    window.location.reload();
  };

  wb.addEventListener("waiting", () => onUpdateAvailable?.({ updateAndReload }));
  wb.addEventListener("externalwaiting", () => onUpdateAvailable?.({ updateAndReload }));

  try {
    await wb.register();
  } catch (err) {
    console.warn("[pwa] service worker registration failed", err);
  }
}
