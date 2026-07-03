import { useEffect, useRef, useState } from "react";

/**
 * Returns true while the user is actively scrolling; becomes false after
 * `idleMs` of no scroll activity. Useful to hide/show floating UI.
 */
export function useScrollIdle(idleMs = 250) {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      setScrolling(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setScrolling(false);
        timer.current = null;
      }, idleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [idleMs]);

  return scrolling;
}
