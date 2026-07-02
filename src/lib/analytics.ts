/**
 * Lightweight, dependency-free analytics event tracker.
 *
 * - Dispatches a CustomEvent on `window` so any provider (GA4, Plausible,
 *   PostHog, custom listener) can attach later without touching call sites.
 * - Forwards to `window.gtag` and `window.plausible` when present.
 * - Safe to import in SSR / non-browser paths — becomes a no-op.
 */

export type AnalyticsEvent =
  | { name: "hero_slide_view"; index: number; slide_id: string; total: number }
  | { name: "hero_slide_change"; from: number; to: number; slide_id: string; via: "autoplay" | "dot_click" | "keyboard" }
  | { name: "hero_dot_click"; index: number; slide_id: string }
  | { name: "hero_keyboard_nav"; key: string; index: number; slide_id: string }
  | { name: "gallery_search"; query: string; results: number }
  | { name: "gallery_filter"; filter_type: "type" | "category"; value: string; results: number }
  | { name: "gallery_lightbox_open"; index: number; total: number; item_title: string; item_type: string }
  | { name: "gallery_lightbox_close"; index: number; item_title: string }
  | { name: "gallery_lightbox_nav"; from: number; to: number; via: "keyboard" | "button" };


type AnyEvent = AnalyticsEvent & { [k: string]: unknown };

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const payload = { ...event, ts: Date.now() } as AnyEvent;

  try {
    window.dispatchEvent(new CustomEvent("app:analytics", { detail: payload }));
  } catch {
    /* noop */
  }

  const w = window as unknown as {
    gtag?: (cmd: string, name: string, params?: Record<string, unknown>) => void;
    plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
  };
  try {
    w.gtag?.("event", event.name, payload);
  } catch {
    /* noop */
  }
  try {
    w.plausible?.(event.name, { props: payload });
  } catch {
    /* noop */
  }

  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event.name, payload);
  }
}
