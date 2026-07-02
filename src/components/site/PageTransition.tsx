import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

/**
 * Global page transitions with graceful fallbacks:
 *  - SSR / prefers-reduced-motion / framer-motion load failure → children as-is.
 *  - Otherwise → lazy-loaded animated shell (fade + blur + scale, 0.45s).
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
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || reduce) return <>{children}</>;

  return (
    <Suspense fallback={<>{children}</>}>
      <MotionShell>{children}</MotionShell>
    </Suspense>
  );
}
