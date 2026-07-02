import { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

/**
 * Cinematic hero backdrop overlay: volumetric spotlights, drifting fog layers,
 * subtle vignette, and mouse-based parallax on light beams.
 * Renders above the base image but below the dark overlay of the hero section.
 * Pointer-events-none — purely decorative. Respects prefers-reduced-motion.
 */
export function CinematicBackdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollShift = useTransform(scrollY, [0, 600], [0, 80]);
  const scrollFade = useTransform(scrollY, [0, 500], [1, 0.35]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 40, damping: 20, mass: 0.6 });
  const py = useSpring(my, { stiffness: 40, damping: 20, mass: 0.6 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mx.set((e.clientX / w - 0.5) * 40);
      my.set((e.clientY / h - 0.5) * 24);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduce]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Volumetric spotlight — left (gold) */}
      <motion.div
        className="absolute -top-40 left-[10%] h-[140vh] w-[45vw] origin-top"
        style={{
          x: px,
          y: scrollShift,
          opacity: scrollFade,
          background:
            "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(201,168,76,0.18) 12deg, rgba(201,168,76,0.05) 24deg, transparent 36deg)",
          filter: "blur(14px)",
          transform: "rotate(8deg)",
        }}
        animate={reduce ? undefined : { rotate: [6, 12, 6] }}
        transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Volumetric spotlight — right (cool white) */}
      <motion.div
        className="absolute -top-40 right-[8%] h-[140vh] w-[42vw] origin-top"
        style={{
          x: py,
          y: scrollShift,
          opacity: scrollFade,
          background:
            "conic-gradient(from 160deg at 50% 0%, transparent 0deg, rgba(180,210,255,0.14) 10deg, rgba(180,210,255,0.04) 22deg, transparent 32deg)",
          filter: "blur(16px)",
          transform: "rotate(-6deg)",
        }}
        animate={reduce ? undefined : { rotate: [-4, -10, -4] }}
        transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Roaming spot */}
      <motion.div
        className="absolute top-1/4 h-[60vh] w-[60vh] rounded-full"
        style={{
          left: "30%",
          background:
            "radial-gradient(circle, rgba(255,240,200,0.10) 0%, transparent 60%)",
          filter: "blur(30px)",
        }}
        animate={reduce ? undefined : { x: ["-10%", "30%", "-10%"], opacity: [0.5, 0.9, 0.5] }}
        transition={reduce ? undefined : { duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fog layer — slow drift */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(to top, rgba(15,20,30,0.7) 0%, rgba(15,20,30,0.25) 40%, transparent 100%)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 90%, rgba(255,255,255,0.06) 0%, transparent 40%), radial-gradient(ellipse at 80% 85%, rgba(255,255,255,0.05) 0%, transparent 45%)",
          filter: "blur(8px)",
        }}
        animate={reduce ? undefined : { x: [0, 30, 0], opacity: [0.6, 1, 0.6] }}
        transition={reduce ? undefined : { duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
        }}
      />
    </div>
  );
}
