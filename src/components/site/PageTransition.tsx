import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Mobile-only page transitions with graceful fallbacks:
 *  - Server / desktop / tablet → renders children as-is (no motion overhead).
 *  - prefers-reduced-motion → renders children as-is.
 *  - framer-motion fails to load for any reason → renders children as-is.
 *  - Otherwise → lazy-loads the animated shell so desktop bundles stay lean.
 */

const MotionShell = lazy(() =>
  import("./PageTransitionMotion")
    .then((m) => ({ default: m.PageTransitionMotion }))
    .catch(() => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> })),
);

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduce;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const reduce = usePrefersReducedMotion();

  if (!isMobile || reduce) return <>{children}</>;

  return <Suspense fallback={<>{children}</>}>
    <MotionShell>{children}</MotionShell>
  </Suspense>;
}
