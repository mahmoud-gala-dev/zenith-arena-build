import { useEffect, useRef, useState } from "react";

/**
 * Returns "up" or "down" based on scroll direction.
 * Ignores tiny movements below the threshold.
 */
export function useScrollDirection(threshold = 8) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      setAtTop(y < 8);
      const diff = y - lastY.current;
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 && y > 80 ? "down" : "up");
        lastY.current = y;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(update);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, atTop } as const;
}
