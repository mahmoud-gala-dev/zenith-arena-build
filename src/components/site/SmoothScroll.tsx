import { useEffect } from "react";
import Lenis from "lenis";
import { useRouterState } from "@tanstack/react-router";
import { logPerfEvent } from "@/lib/perf";

/**
 * Site-wide smooth scrolling powered by Lenis.
 * - Respects prefers-reduced-motion + user preference (localStorage).
 * - Skips low-end devices (few CPU cores, low memory, Save-Data, slow network).
 * - Runtime FPS watchdog: disables Lenis if sustained jank is detected while scrolling.
 * - Reports enable/disable/jank events to window.__perf via logPerfEvent().
 * - Exposes window.__smoothScroll { enabled, reason, fps, setEnabled(on) }.
 */

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export const SMOOTH_DISABLE_KEY = "perf:disable-smooth-scroll";

export type SmoothScrollState = {
  enabled: boolean;
  reason: string;
  fps: number;
  setEnabled: (on: boolean) => void;
  subscribe: (cb: () => void) => () => void;
};

declare global {
  interface Window {
    __smoothScroll?: SmoothScrollState;
  }
}

function ensureState(): SmoothScrollState {
  if (typeof window === "undefined") {
    return {
      enabled: false,
      reason: "ssr",
      fps: 0,
      setEnabled: () => {},
      subscribe: () => () => {},
    };
  }
  if (window.__smoothScroll) return window.__smoothScroll;
  const subs = new Set<() => void>();
  const state: SmoothScrollState = {
    enabled: false,
    reason: "init",
    fps: 0,
    setEnabled: () => {},
    subscribe: (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
  (state as unknown as { _notify: () => void })._notify = () => {
    subs.forEach((cb) => {
      try {
        cb();
      } catch {
        /* ignore */
      }
    });
  };
  window.__smoothScroll = state;
  return state;
}

function shouldSkipSmooth(): { skip: boolean; reason: string } {
  if (typeof window === "undefined") return { skip: true, reason: "ssr" };
  try {
    if (localStorage.getItem(SMOOTH_DISABLE_KEY) === "1")
      return { skip: true, reason: "user-disabled" };
  } catch {
    /* ignore */
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return { skip: true, reason: "reduced-motion" };
  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return { skip: true, reason: "save-data" };
  const eff = nav.connection?.effectiveType;
  if (eff === "slow-2g" || eff === "2g") return { skip: true, reason: `net-${eff}` };
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  if (cores <= 4 && mem <= 2) return { skip: true, reason: "low-end-device" };
  return { skip: false, reason: "enabled" };
}

export function SmoothScroll() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = ensureState();
    const notify = (state as unknown as { _notify: () => void })._notify;

    // Wire the user-facing setter (persists preference, reloads to (re)init cleanly).
    state.setEnabled = (on: boolean) => {
      try {
        if (on) localStorage.removeItem(SMOOTH_DISABLE_KEY);
        else localStorage.setItem(SMOOTH_DISABLE_KEY, "1");
      } catch {
        /* ignore */
      }
      logPerfEvent("smooth-scroll:user-toggle", { enabled: on });
      window.location.reload();
    };

    const decision = shouldSkipSmooth();
    if (decision.skip) {
      state.enabled = false;
      state.reason = decision.reason;
      logPerfEvent("smooth-scroll:disabled", { reason: decision.reason });
      notify();
      return;
    }

    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    // syncTouch on iOS 15+ can fight the browser's native inertia. Keep touch
    // handling delegated to the browser on touch devices — Lenis still smooths
    // wheel + programmatic scrolls. This measurably reduces jump/jank on
    // iOS/Android without losing the desktop experience.
    const lenis = new Lenis({
      lerp: 0.085,
      duration: 1.15,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: false,
      prevent: (node) =>
        !!node.closest(
          "[data-lenis-prevent],[data-radix-scroll-area-viewport],[data-slot='sheet-content'],.snap-x-rail",
        ),
    });

    state.enabled = true;
    state.reason = "enabled";
    logPerfEvent("smooth-scroll:enabled", { touch: isTouch });
    notify();

    let rafId = 0;
    let disposed = false;

    // Continuous FPS meter for the overlay (EMA), plus a jank watchdog that
    // only samples while the user is actively scrolling.
    let lastFrame = performance.now();
    let ema = 60;
    let scrolling = false;
    let scrollIdleTimer: number | null = null;
    let windowStart = 0;
    let frameCount = 0;
    let badWindows = 0;
    let notifyTick = 0;
    const FPS_FLOOR = 40;
    const BAD_WINDOWS_LIMIT = 3;

    const disableForJank = () => {
      if (disposed) return;
      // eslint-disable-next-line no-console
      console.warn("[SmoothScroll] sustained low FPS during scroll — falling back to native scroll");
      logPerfEvent("smooth-scroll:jank-fallback", { fps: Math.round(ema) });
      try {
        localStorage.setItem(SMOOTH_DISABLE_KEY, "1");
      } catch {
        /* ignore */
      }
      state.enabled = false;
      state.reason = "jank-fallback";
      notify();
      cleanup();
    };

    const onScrollStart = () => {
      scrolling = true;
      if (windowStart === 0) {
        windowStart = performance.now();
        frameCount = 0;
      }
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrolling = false;
        windowStart = 0;
        frameCount = 0;
        badWindows = 0;
      }, 200);
    };

    lenis.on("scroll", onScrollStart);

    const raf = (time: number) => {
      lenis.raf(time);
      const dt = time - lastFrame;
      lastFrame = time;
      if (dt > 0 && dt < 500) {
        const instant = 1000 / dt;
        ema = ema * 0.9 + instant * 0.1;
      }
      // Notify overlay ~4x/sec.
      notifyTick++;
      if (notifyTick >= 15) {
        notifyTick = 0;
        state.fps = ema;
        notify();
      }
      if (scrolling) {
        frameCount++;
        const elapsed = time - windowStart;
        if (elapsed >= 1000) {
          const fps = (frameCount * 1000) / elapsed;
          if (fps < FPS_FLOOR) {
            badWindows++;
            logPerfEvent("smooth-scroll:jank-window", { fps: Math.round(fps), badWindows });
            if (badWindows >= BAD_WINDOWS_LIMIT) {
              disableForJank();
              return;
            }
          } else {
            badWindows = 0;
          }
          windowStart = time;
          frameCount = 0;
        }
      }
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Anchor click interception — passive:false because we preventDefault().
    const onAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#") || href.length < 2) return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onAnchorClick, { passive: false });

    function cleanup() {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("click", onAnchorClick);
      if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    }

    return cleanup;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
