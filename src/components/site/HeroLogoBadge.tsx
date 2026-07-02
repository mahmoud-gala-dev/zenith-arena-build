import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "./Logo";

/**
 * Ambient logo badge for the hero — subtle, non-distracting.
 * Floats gently, breathes, and pulses a soft golden glow every ~12s.
 * Respects prefers-reduced-motion (renders static).
 */
export function HeroLogoBadge({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className}>
        <Logo light className="[&_img]:!h-14 sm:[&_img]:!h-16" />
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -4, 0] }}
      transition={{
        opacity: { duration: 0.8, ease: "easeOut" },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{ willChange: "transform" }}
    >
      <motion.div
        className="relative inline-block"
        animate={{ scale: [1, 1.015, 1], rotate: [-0.4, 0.4, -0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Soft golden glow pulse every ~12s */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-6 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.08) 40%, transparent 70%)",
            filter: "blur(14px)",
          }}
          animate={{ opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <Logo light className="[&_img]:!h-14 sm:[&_img]:!h-16" />

        {/* Occasional light sweep */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -inset-x-2 overflow-hidden"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
            mixBlendMode: "overlay",
          }}
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 10, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
