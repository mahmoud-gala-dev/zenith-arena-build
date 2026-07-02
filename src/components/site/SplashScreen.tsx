import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const KEY = "apex-splash-seen";

export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.sessionStorage.getItem(KEY);
    if (seen) return;
    setShow(true);
    document.body.style.overflow = "hidden";
    const leave = setTimeout(() => setLeaving(true), 2600);
    const done = setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
      window.sessionStorage.setItem(KEY, "1");
    }, 3300);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink transition-all duration-700"
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? "scale(1.04)" : "scale(1)" }}
    >
      <div className="absolute inset-0 grid-texture opacity-40" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* Animated brand logo */}
        <div className="relative">
          <span
            className="absolute -inset-6 rounded-3xl border border-primary/40"
            style={{ animation: "ring-pulse 1.8s ease-out infinite" }}
          />
          <div
            className="relative flex items-center justify-center px-4 py-2"
            style={{ animation: "scale-in 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <Logo light className="[&_img]:!h-28 sm:[&_img]:!h-32 lg:[&_img]:!h-40 [&_img]:!max-w-none" />
          </div>
        </div>

        <p
          className="mt-6 text-xs font-medium uppercase tracking-[0.4em] text-white/50"
          style={{ animation: "fade-in 0.9s ease-out 1.2s both" }}
        >
          Sports Infrastructure
        </p>

        {/* Progress line */}
        <div className="mt-8 h-px w-40 overflow-hidden bg-white/10">
          <span
            className="block h-full origin-left bg-gradient-gold"
            style={{ animation: "draw-line 2.4s cubic-bezier(0.4,0,0.2,1) 0.4s both" }}
          />
        </div>
      </div>
    </div>
  );
}
