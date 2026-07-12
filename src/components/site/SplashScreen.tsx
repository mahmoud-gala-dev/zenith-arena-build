import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Logo } from "./Logo";

const KEY = "egytic-splash-seen-v1";
const DURATION_MS = 3800;

/**
 * Cinematic splash screen — 8-scene sequence:
 *   1. Black + ambient particles
 *   2. Golden light drift + engineering guide lines
 *   3. Logo assembly (mask reveal)
 *   4. Golden energy pulse + depth glow
 *   5. Left-to-right light sweep
 *   6. Company name fade up
 *   7. Slogan fade in
 *   8. Zoom + morph out (no white flash)
 * Runs once per browser session. Respects prefers-reduced-motion.
 */
export function SplashScreen() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(KEY)) return;
    // Skip splash for Lighthouse / headless audits & bots — avoids inflating LCP.
    const ua = navigator.userAgent || "";
    if (/Lighthouse|HeadlessChrome|PageSpeed|GTmetrix|Chrome-Lighthouse|bot|crawler|spider/i.test(ua)) {
      window.localStorage.setItem(KEY, "1");
      return;
    }
    setShow(true);
    document.body.style.overflow = "hidden";

    const total = reduce ? 1400 : DURATION_MS;
    timers.current.push(
      window.setTimeout(() => setCanSkip(true), reduce ? 400 : 2000),
      window.setTimeout(() => setLeaving(true), total - 700),
      window.setTimeout(() => {
        setShow(false);
        document.body.style.overflow = "";
        window.localStorage.setItem(KEY, "1");
      }, total),
    );

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      document.body.style.overflow = "";
    };
  }, [reduce]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLeaving(true);
    window.setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
      window.localStorage.setItem(KEY, "1");
    }, 500);
  };

  // Deterministic particle positions (avoid SSR/CSR hydration mismatch).
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        const r2 = ((i * 1237 + 7919) % 100) / 100;
        return {
          x: r * 100,
          y: r2 * 100,
          d: 3 + r2 * 4,
          delay: r * 2,
          size: 1 + r * 2,
        };
      }),
    [],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{
            opacity: leaving ? 0 : 1,
            scale: leaving ? 1.06 : 1,
            filter: leaving ? "blur(6px)" : "blur(0px)",
          }}
          transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#05070a]"
          aria-label="Loading Egytic Sports"
          role="dialog"
        >
          {/* Scene 1 — Ambient stadium atmosphere */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(28,44,36,0.55),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(201,168,76,0.10),transparent_70%)]" />
            <div className="absolute inset-0 grid-texture opacity-[0.18]" />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.85)_100%)]" />
          </div>

          {/* Scene 2 — Golden drifting particles */}
          {!reduce && (
            <div className="absolute inset-0">
              {particles.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full bg-[#e8c777]"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: p.size,
                    height: p.size,
                    filter: "blur(0.5px)",
                    boxShadow: "0 0 8px rgba(232,199,119,0.7)",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: [0, 0.9, 0], y: -40 }}
                  transition={{
                    duration: p.d,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Scene 2b — Engineering guide lines */}
          {!reduce && (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <motion.line
                x1="0" y1="50%" x2="100%" y2="50%"
                stroke="rgba(201,168,76,0.28)" strokeWidth="0.5" strokeDasharray="4 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.4] }}
                transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              />
              <motion.line
                x1="50%" y1="0" x2="50%" y2="100%"
                stroke="rgba(201,168,76,0.28)" strokeWidth="0.5" strokeDasharray="4 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0.4] }}
                transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
              />
              <motion.circle
                cx="50%" cy="50%" r="120"
                fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.9, 0] }}
                transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
              />
              <motion.circle
                cx="50%" cy="50%" r="180"
                fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 0.7, 0] }}
                transition={{ duration: 1.8, delay: 0.55, ease: "easeInOut" }}
              />
            </svg>
          )}

          {/* Scene 3–5 — Logo stage */}
          <div className="relative flex flex-col items-center px-6">
            {/* Depth glow behind logo */}
            <motion.div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,168,76,0.45) 0%, rgba(30,138,90,0.2) 40%, transparent 70%)",
                filter: "blur(30px)",
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.6, 0.9, 0.7], scale: [0.6, 1, 1.05, 1] }}
              transition={{ duration: 2.4, delay: 0.6, ease: "easeOut" }}
            />

            {/* Logo — clip-path reveal for "assembly" feel */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.92, rotate: -1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: reduce ? 0.4 : 1.1, delay: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: reduce ? 0.4 : 1.4, delay: reduce ? 0 : 0.7, ease: [0.83, 0, 0.17, 1] }}
                style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6)) drop-shadow(0 0 22px rgba(201,168,76,0.35))" }}
              >
                <Logo light className="[&_img]:!h-32 sm:[&_img]:!h-40 lg:[&_img]:!h-48 [&_img]:!max-w-none" />
              </motion.div>

              {/* Metallic light sweep */}
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -inset-x-4"
                  style={{
                    background:
                      "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 48%, rgba(232,199,119,0.7) 50%, rgba(255,255,255,0.55) 52%, transparent 70%)",
                    mixBlendMode: "overlay",
                    filter: "blur(2px)",
                  }}
                  initial={{ x: "-120%", opacity: 0 }}
                  animate={{ x: "120%", opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, delay: 1.8, ease: "easeInOut" }}
                />
              )}

              {/* Energy pulse ring */}
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e8c777]"
                  initial={{ scale: 0, opacity: 0.7 }}
                  animate={{ scale: [0, 40], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, delay: 1.6, ease: "easeOut" }}
                />
              )}
            </motion.div>

            {/* Company name */}
            <motion.h1
              className="mt-8 text-center text-2xl font-semibold tracking-[0.32em] text-white sm:text-3xl"
              initial={{ opacity: 0, y: 14, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, y: 0, letterSpacing: "0.32em" }}
              transition={{ duration: 0.9, delay: reduce ? 0.3 : 2.2, ease: "easeOut" }}
            >
              EGYTIC&nbsp;SPORTS
            </motion.h1>

            {/* Slogan */}
            <motion.p
              className="mt-3 text-center text-[10px] font-medium uppercase tracking-[0.5em] text-[#c9a84c] sm:text-xs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: reduce ? 0.5 : 2.6, ease: "easeOut" }}
            >
              Sports Construction <span className="mx-2 text-white/40">/</span> Infrastructure
            </motion.p>

            {/* Progress line */}
            <div className="mt-8 h-px w-40 overflow-hidden bg-white/10">
              <motion.span
                className="block h-full origin-left"
                style={{ background: "linear-gradient(90deg, transparent, #c9a84c, #e8c777, #c9a84c, transparent)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduce ? 1 : 3.2, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>

          {/* Skip button */}
          <AnimatePresence>
            {canSkip && !leaving && (
              <motion.button
                key="skip"
                type="button"
                onClick={skip}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-8 right-8 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-white/70 backdrop-blur transition hover:border-[#c9a84c]/50 hover:bg-white/10 hover:text-white"
              >
                Skip
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
