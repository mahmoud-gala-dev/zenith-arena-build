import { useRef, type ReactNode, type JSX } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium scroll-reveal: fade + slide + blur, staggered via `delay`.
 * Respects prefers-reduced-motion (falls back to opacity only).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  id,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
  id?: string;
  y?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15, margin: "0px 0px -40px 0px" });
  const reduce = useReducedMotion();

  const MotionTag = motion(Tag as any);

  const initial = reduce
    ? { opacity: 0 }
    : { opacity: 0, y, filter: "blur(8px)", scale: 0.985 };
  const animate = reduce
    ? { opacity: 1 }
    : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 };

  return (
    <MotionTag
      ref={ref as any}
      id={id}
      className={cn(className)}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{
        duration: reduce ? 0.3 : 0.7,
        delay: (delay || 0) / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      {children}
    </MotionTag>
  );
}
