import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "./Logo";

/**
 * Cinematic hero logo badge — enlarged, layered, and alive.
 *
 * Layers (back → front):
 *   1. Rotating conic aura ring (gold → white → gold), very slow
 *   2. Breathing radial gold glow
 *   3. Secondary cool halo for depth
 *   4. Orbiting spark particles (3)
 *   5. The mark itself (breathes + micro-rotate + float)
 *   6. Periodic diagonal light sweep across the mark
 *
 * Dramatic entrance: scale-up + blur-in + light burst.
 * Respects prefers-reduced-motion (renders static, still enlarged).
 */
export function HeroLogoBadge({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  // Enlarged mark: h-32 → 2xl:h-56. Anchor the hero without crowding the headline.
  const logoSize =
    "[&_img]:!h-32 sm:[&_img]:!h-40 md:[&_img]:!h-48 lg:[&_img]:!h-52 xl:[&_img]:!h-56";

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
      initial={{ opacity: 0, y: 20, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1, filter: "blur(0px)" }}
      transition={{
        opacity: { duration: 1.1, ease: "easeOut" },
        scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: 1.1, ease: "easeOut" },
        y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
      }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      <motion.div
        className="relative inline-block"
        animate={{ scale: [1, 1.025, 1], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 1 — Rotating conic aura ring */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-16 rounded-full opacity-70"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(201,168,76,0.0) 0deg, rgba(201,168,76,0.55) 90deg, rgba(255,255,255,0.35) 180deg, rgba(201,168,76,0.55) 270deg, rgba(201,168,76,0.0) 360deg)",
            filter: "blur(28px)",
            maskImage: "radial-gradient(circle, black 40%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 72%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        />

        {/* 2 — Breathing radial gold glow */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-12 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.55) 0%, rgba(201,168,76,0.14) 45%, transparent 72%)",
            filter: "blur(24px)",
          }}
          animate={{ opacity: [0.25, 0.75, 0.25], scale: [0.94, 1.08, 0.94] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 3 — Cool secondary halo, offset for depth */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-8 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(180,210,255,0.35) 0%, transparent 60%)",
            filter: "blur(18px)",
          }}
          animate={{ opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* 4 — Orbiting spark particles */}
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[rgba(255,235,180,0.9)]"
            style={{
              boxShadow: "0 0 12px 2px rgba(255,220,140,0.8)",
              marginLeft: -3,
              marginTop: -3,
            }}
            animate={{
              rotate: [i * 120, i * 120 + 360],
              opacity: [0, 1, 0],
            }}
            transition={{
              rotate: { duration: 14 + i * 3, repeat: Infinity, ease: "linear" },
              opacity: { duration: 14 + i * 3, repeat: Infinity, ease: "easeInOut" },
            }}
            // Trick: apply the orbital radius via a nested translate so rotate stays around the center.
          >
            <span
              className="absolute left-1/2 top-1/2 block h-1.5 w-1.5 rounded-full bg-[rgba(255,235,180,0.9)]"
              style={{
                boxShadow: "0 0 14px 3px rgba(255,220,140,0.9)",
                transform: `translate(-50%, -50%) translateY(-${110 + i * 14}px)`,
              }}
            />
          </motion.span>
        ))}

        {/* 5 — The mark */}
        <Logo light className={`relative z-10 ${logoSize}`} />

        {/* 6 — Diagonal light sweep */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -inset-x-6 overflow-hidden"
          style={{
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)",
            mixBlendMode: "overlay",
          }}
          animate={{ x: ["-130%", "130%"] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
        />

        {/* 7 — Entrance burst (fires once) */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-20 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,240,200,0.55) 0%, transparent 60%)",
          }}
          initial={{ opacity: 0.9, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
