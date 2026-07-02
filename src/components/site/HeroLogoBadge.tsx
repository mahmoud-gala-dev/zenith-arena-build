import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "./Logo";

/**
 * Ambient logo badge for the hero — subtle, non-distracting, but with presence.
 * Floats gently, breathes, micro-rotates (<0.5°), and pulses a soft golden glow every ~12s.
 * A slow diagonal light sweep passes across the mark occasionally.
 * Hidden on mobile to save space. Respects prefers-reduced-motion (renders static).
 */
export function HeroLogoBadge({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  // Enlarged mark: h-20 → xl:h-32. Feels premium without dominating the headline.
  const logoSize =
    "[&_img]:!h-24 sm:[&_img]:!h-28 md:[&_img]:!h-32 lg:[&_img]:!h-36 xl:[&_img]:!h-40";

  if (reduce) {
    return (
      <div className={className}>
        <Logo light className={logoSize} />
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: [0, -5, 0], filter: "blur(0px)" }}
      transition={{
        opacity: { duration: 1, ease: "easeOut" },
        filter: { duration: 1, ease: "easeOut" },
        y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      <motion.div
        className="relative inline-block"
        animate={{ scale: [1, 1.02, 1], rotate: [-0.4, 0.4, -0.4] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Ambient golden aura */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.42) 0%, rgba(201,168,76,0.10) 45%, transparent 72%)",
            filter: "blur(22px)",
          }}
          animate={{ opacity: [0.18, 0.6, 0.18], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <Logo light className={logoSize} />

        {/* Slow diagonal light sweep */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -inset-x-4 overflow-hidden"
          style={{
            background:
              "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.4) 50%, transparent 58%)",
            mixBlendMode: "overlay",
          }}
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 11, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
