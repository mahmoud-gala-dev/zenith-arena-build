import { useEffect } from "react";
import Lenis from "lenis";
import { useRouterState } from "@tanstack/react-router";

/**
 * Site-wide smooth scrolling powered by Lenis.
 * - Respects prefers-reduced-motion (falls back to native scroll).
 * - Scrolls to top on route change.
 * - Handles same-page #hash anchors.
 * - No-ops on the server.
 */
export function SmoothScroll() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // Silkier feel: exponential ease-out + slightly lower lerp for buttery
    // interpolation. Mobile uses syncTouch for a unified inertial feel that
    // matches the desktop smoothness (was previously native-only).
    const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const lenis = new Lenis({
      lerp: 0.085,
      duration: 1.15,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // expo out
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      syncTouch: isTouch,
      syncTouchLerp: 0.08,
      // Let overlays / modals / horizontal snap rails handle their own scroll.
      prevent: (node) =>
        !!node.closest(
          "[data-lenis-prevent],[data-radix-scroll-area-viewport],[data-slot='sheet-content'],.snap-x-rail",
        ),
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Expose for programmatic scroll-to (used by anchor handling).
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Anchor click interception — smoothly scroll to same-page #hash targets.
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

    return () => {
      document.removeEventListener("click", onAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  // Route change → scroll to top (unless there's a hash).
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
