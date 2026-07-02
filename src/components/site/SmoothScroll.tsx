import { useEffect } from "react";
import Lenis from "lenis";
import { useRouterState } from "@tanstack/react-router";

/**
 * Site-wide smooth scrolling powered by Lenis.
 * - Respects prefers-reduced-motion (falls back to native scroll).
 * - Skips low-end devices (few CPU cores, low memory, Save-Data, slow network).
 * - Runtime FPS watchdog: disables Lenis if sustained jank is detected.
 * - Scrolls to top on route change.
 * - Handles same-page #hash anchors.
 * - No-ops on the server.
 */

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

const DISABLE_KEY = "perf:disable-smooth-scroll";

function shouldSkipSmooth(): { skip: boolean; reason?: string } {
  if (typeof window === "undefined") return { skip: true, reason: "ssr" };

  // Manual override (set by user or watchdog on previous session).
  try {
    if (localStorage.getItem(DISABLE_KEY) === "1") {
      return { skip: true, reason: "user-disabled" };
    }
  } catch {
    /* ignore */
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { skip: true, reason: "reduced-motion" };
  }

  const nav = navigator as NavigatorWithHints;

  if (nav.connection?.saveData) return { skip: true, reason: "save-data" };
  const eff = nav.connection?.effectiveType;
  if (eff === "slow-2g" || eff === "2g") return { skip: true, reason: `net-${eff}` };

  // Heuristic: <=4 cores AND <=2GB RAM = low-end.
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  if (cores <= 4 && mem <= 2) return { skip: true, reason: "low-end-device" };

  return { skip: false };
}

export function SmoothScroll() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { skip, reason } = shouldSkipSmooth();
    if (skip) {
      if (reason && reason !== "ssr") {
        // eslint-disable-next-line no-console
        console.info(`[SmoothScroll] disabled: ${reason}`);
      }
      return;
    }

    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const lenis = new Lenis({
      lerp: 0.085,
      duration: 1.15,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: isTouch,
      syncTouchLerp: 0.08,
      prevent: (node) =>
        !!node.closest(
          "[data-lenis-prevent],[data-radix-scroll-area-viewport],[data-slot='sheet-content'],.snap-x-rail",
        ),
    });

    let rafId = 0;
    let disposed = false;

    // FPS watchdog — only samples while the user is actively scrolling.
    // If we see 3 consecutive 1s windows below 40fps during scroll, we
    // disable Lenis for the rest of the session (and remember it).
    let scrolling = false;
    let scrollIdleTimer: number | null = null;
    let frameCount = 0;
    let windowStart = 0;
    let badWindows = 0;
    const FPS_FLOOR = 40;
    const BAD_WINDOWS_LIMIT = 3;

    const disableForJank = () => {
      if (disposed) return;
      // eslint-disable-next-line no-console
      console.warn("[SmoothScroll] sustained low FPS during scroll — falling back to native scroll");
      try {
        localStorage.setItem(DISABLE_KEY, "1");
      } catch {
        /* ignore */
      }
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
      if (scrolling) {
        frameCount++;
        const elapsed = time - windowStart;
        if (elapsed >= 1000) {
          const fps = (frameCount * 1000) / elapsed;
          if (fps < FPS_FLOOR) {
            badWindows++;
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
    document.addEventListener("click", onAnchorClick);

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
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname]);

  return null;
}
