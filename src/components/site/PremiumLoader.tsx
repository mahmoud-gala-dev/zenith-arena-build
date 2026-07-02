import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium loading indicator — replaces generic spinners.
 * A soft logo-mark pulse with a golden light sweep and tiny orbiting particles.
 * Respects prefers-reduced-motion (renders a static shimmer).
 */
export function PremiumLoader({
  className,
  label,
  size = 48,
}: {
  className?: string;
  label?: string;
  size?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} role="status" aria-live="polite">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Aura */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.55) 0%, rgba(201,168,76,0.1) 55%, transparent 75%)",
            filter: "blur(10px)",
          }}
          animate={reduce ? undefined : { opacity: [0.35, 0.9, 0.35], scale: [0.95, 1.1, 0.95] }}
          transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Core ring */}
        <motion.span
          aria-hidden
          className="absolute inset-1 rounded-full border-2"
          style={{
            borderColor: "rgba(201,168,76,0.6)",
            borderTopColor: "transparent",
            borderRightColor: "transparent",
          }}
          animate={reduce ? undefined : { rotate: 360 }}
          transition={reduce ? undefined : { duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
        {/* Center dot */}
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(201,168,76)]"
          animate={reduce ? undefined : { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Orbiting particles */}
        {!reduce && [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-white/80"
            style={{ marginLeft: -2, marginTop: -2 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2 + i * 0.4, repeat: Infinity, ease: "linear" }}
          >
            <span
              className="absolute block h-1 w-1 rounded-full bg-white/80"
              style={{ transform: `translate(${size / 2 - 4}px, 0)` }}
            />
          </motion.span>
        ))}
      </div>
      {label && <span className="text-xs font-medium tracking-wide text-muted-foreground">{label}</span>}
    </div>
  );
}
