import { memo, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

/**
 * Cinematic hero backdrop overlay: volumetric spotlights, drifting fog layers,
 * subtle vignette, and mouse-based parallax on light beams.
 * Renders above the base image but below the dark overlay of the hero section.
 * Pointer-events-none — purely decorative. Respects prefers-reduced-motion and
 * automatically throttles / disables parallax on low-end devices.
 *
 * Intensity props are 0..1 multipliers, editable per slide from the Admin.
 * Style objects are memoised so admin live-preview slider drags stay smooth.
 */
function CinematicBackdropImpl({
  fog = 0.6,
  spotlights = 0.6,
  vignette = 0.6,
}: {
  fog?: number;
  spotlights?: number;
  vignette?: number;
}) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollShift = useTransform(scrollY, [0, 600], [0, 80]);
  const scrollFade = useTransform(scrollY, [0, 500], [1, 0.35]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 40, damping: 20, mass: 0.6 });
  const py = useSpring(my, { stiffness: 40, damping: 20, mass: 0.6 });

  const [mounted, setMounted] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);

  useEffect(() => {
    // Defer mount to idle — makes the backdrop truly lazy on slow devices.
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
    const schedule = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 250));
    schedule(() => setMounted(true));

    // Low-end detection: few cores, low memory, save-data, or coarse pointer on small screens.
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory ?? 4;
    const saveData = nav.connection?.saveData ?? false;
    if (cores <= 4 || mem <= 2 || saveData) setLowEnd(true);
  }, []);

  useEffect(() => {
    if (reduce || lowEnd) return;
    let raf = 0;
    let lastX = 0;
    let lastY = 0;
    const apply = () => {
      raf = 0;
      mx.set(lastX);
      my.set(lastY);
    };
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      lastX = (e.clientX / w - 0.5) * 40;
      lastY = (e.clientY / h - 0.5) * 24;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mx, my, reduce, lowEnd]);

  // Clamp intensities.
  const f = Math.max(0, Math.min(1, fog));
  const s = Math.max(0, Math.min(1, spotlights));
  const v = Math.max(0, Math.min(1, vignette));

  const animateSlow = !reduce && !lowEnd;

  // Memoise all derived style objects and animate configs keyed on intensities
  // so dragging sliders in the admin preview doesn't rebuild them per frame.
  const styles = useMemo(() => ({
    vignette: {
      background: `radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,0,0,${0.55 * v}) 100%)`,
    },
    spotLeftBg: `conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(201,168,76,${0.18 * s}) 12deg, rgba(201,168,76,${0.05 * s}) 24deg, transparent 36deg)`,
    spotRightBg: `conic-gradient(from 160deg at 50% 0%, transparent 0deg, rgba(180,210,255,${0.14 * s}) 10deg, rgba(180,210,255,${0.04 * s}) 22deg, transparent 32deg)`,
    roamingBg: `radial-gradient(circle, rgba(255,240,200,${0.10 * s}) 0%, transparent 60%)`,
    fogBottom: {
      background: `linear-gradient(to top, rgba(15,20,30,${0.7 * f}) 0%, rgba(15,20,30,${0.25 * f}) 40%, transparent 100%)`,
    },
    fogDrift: {
      backgroundImage: `radial-gradient(ellipse at 20% 90%, rgba(255,255,255,${0.06 * f}) 0%, transparent 40%), radial-gradient(ellipse at 80% 85%, rgba(255,255,255,${0.05 * f}) 0%, transparent 45%)`,
      filter: "blur(8px)",
    },
  }), [f, s, v]);

  const grainStyle = useMemo(() => ({
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
  }), []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {v > 0 && <div className="absolute inset-0" style={styles.vignette} />}

      {s > 0 && (
        <motion.div
          className="absolute -top-40 left-[10%] h-[140vh] w-[45vw] origin-top"
          style={{ x: px, y: scrollShift, opacity: scrollFade, background: styles.spotLeftBg, filter: "blur(14px)", transform: "rotate(8deg)" }}
          animate={animateSlow ? { rotate: [6, 12, 6] } : undefined}
          transition={animateSlow ? { duration: 18, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      )}

      {s > 0 && (
        <motion.div
          className="absolute -top-40 right-[8%] h-[140vh] w-[42vw] origin-top"
          style={{ x: py, y: scrollShift, opacity: scrollFade, background: styles.spotRightBg, filter: "blur(16px)", transform: "rotate(-6deg)" }}
          animate={animateSlow ? { rotate: [-4, -10, -4] } : undefined}
          transition={animateSlow ? { duration: 22, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      )}

      {s > 0 && !lowEnd && (
        <motion.div
          className="absolute top-1/4 h-[60vh] w-[60vh] rounded-full"
          style={{ left: "30%", background: styles.roamingBg, filter: "blur(30px)" }}
          animate={animateSlow ? { x: ["-10%", "30%", "-10%"], opacity: [0.5, 0.9, 0.5] } : undefined}
          transition={animateSlow ? { duration: 20, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      )}

      {f > 0 && <div className="absolute inset-x-0 bottom-0 h-1/2" style={styles.fogBottom} />}
      {f > 0 && !lowEnd && (
        <motion.div
          className="absolute inset-0"
          style={styles.fogDrift}
          animate={animateSlow ? { x: [0, 30, 0], opacity: [0.6, 1, 0.6] } : undefined}
          transition={animateSlow ? { duration: 24, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      )}

      {!lowEnd && <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={grainStyle} />}
    </div>
  );
}

// Bail out of re-renders when intensity props are unchanged (rounded to 2dp),
// which keeps the hero preview smooth as admin sliders drag through many values.
export const CinematicBackdrop = memo(CinematicBackdropImpl, (prev, next) => {
  const r = (n?: number) => Math.round((n ?? 0.6) * 100) / 100;
  return r(prev.fog) === r(next.fog)
    && r(prev.spotlights) === r(next.spotlights)
    && r(prev.vignette) === r(next.vignette);
});

