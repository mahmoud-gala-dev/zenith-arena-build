import { useRef, type ReactNode, type JSX } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium scroll-reveal: fade + slide + blur, staggered via `delay`.
 * Respects prefers-reduced-motion (falls back to opacity only).
 *
 * Tunable per-section for a unified premium feel:
 *  - `direction`: "up" | "down" | "left" | "right" | "none" (default "up")
 *  - `duration`:  seconds (default 0.7)
 *  - `y`:         travel distance in px for up/down (default 24)
 *  - `delay`:     stagger delay in ms
 */
export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  id,
  y = 24,
  direction = "up",
  duration,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
  id?: string;
  y?: number;
  direction?: RevealDirection;
  duration?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();

  const MotionTag = motion(Tag as any);

  const offset = (() => {
    if (reduce || direction === "none") return { x: 0, y: 0 };
    switch (direction) {
      case "down": return { x: 0, y: -y };
      case "left": return { x: y, y: 0 };
      case "right": return { x: -y, y: 0 };
      case "up":
      default: return { x: 0, y };
    }
  })();

  const initial = reduce
    ? { opacity: 0 }
    : { opacity: 0, ...offset, filter: "blur(8px)", scale: 0.985 };
  const animate = reduce
    ? { opacity: 1 }
    : { opacity: 1, x: 0, y: 0, filter: "blur(0px)", scale: 1 };

  return (
    <MotionTag
      ref={ref as any}
      id={id}
      className={cn(className)}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{
        duration: reduce ? 0.3 : (duration ?? 0.7),
        delay: (delay || 0) / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </MotionTag>
  );
}
