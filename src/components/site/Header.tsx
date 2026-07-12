import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

import { useBranding, DEFAULT_LOGO_MOTION } from "@/hooks/useBranding";

import { useLang } from "@/i18n/LanguageProvider";
import { menusByLocationQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";


export function Header() {
  const { t, lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: branding } = useBranding();

  // Low-power heuristic: skip heavy effects on constrained devices.
  const lowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    return (mem !== undefined && mem <= 4) || cores <= 4;
  }, []);

  const motionCfg = branding?.logo_motion?.[lang] ?? DEFAULT_LOGO_MOTION;
  const motionOn = !reduceMotion && motionCfg.enabled;
  const intensity = Math.max(0, Math.min(100, motionCfg.intensity)) / 100; // 0..1
  const speedFactor = 0.5 + (100 - Math.max(0, Math.min(100, motionCfg.speed))) / 50; // 0.5..2.5
  const outerBlur = lowPower ? 8 : 12 + Math.round(6 * intensity);
  const innerBlur = lowPower ? 5 : 6 + Math.round(4 * intensity);
  const auraOpacity = 0.35 + 0.45 * intensity;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ar = lang === "ar";
  const links = [
    { to: "/", label: t.nav.home },
    { to: "/services", label: t.nav.services },
    { to: "/projects", label: t.nav.projects },
    { to: "/products", label: t.nav.products },
    { to: "/gallery", label: ar ? "معرض الصور" : "Gallery" },
    { to: "/knowledge", label: t.nav.knowledge },
    { to: "/about", label: t.nav.about },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out",
        "hidden md:block",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] text-foreground"
          : "bg-gradient-to-b from-black/40 via-black/10 to-transparent text-white",
      )}
    >

      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out",
          scrolled ? "h-24 sm:h-28 lg:h-28" : "h-32 sm:h-36 lg:h-40 xl:h-44",
        )}
      >
        <Link to="/" aria-label="Egytic home" className="group relative inline-flex items-center">
          <motion.span
            initial={motionOn ? { opacity: 0, scale: 0.6, rotate: -12, filter: "blur(10px)" } : { opacity: 0 }}
            animate={motionOn ? { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" } : { opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={motionOn ? { scale: 1.1 } : undefined}
            className={cn(
              "group/logo relative inline-flex items-center justify-center will-change-transform",
              scrolled ? "scale-100" : "scale-110",
              "[&_img]:!h-20 sm:[&_img]:!h-24 lg:[&_img]:!h-28 xl:[&_img]:!h-32",
            )}
          >
            {/* Rotating conic aura ring — brand gold */}
            {motionOn && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-18%] -z-10 rounded-full transition-[filter,opacity] duration-500 ease-out group-hover/logo:opacity-100"
                style={{
                  opacity: auraOpacity,
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--gold) 85%, transparent) 60deg, transparent 140deg, color-mix(in oklab, var(--gold) 55%, transparent) 220deg, transparent 320deg)",
                  filter: `blur(${outerBlur}px)`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 14 * speedFactor, repeat: Infinity, ease: "linear" }}
                whileHover={{ scale: 1.06 }}
              />
            )}
            {/* Counter-rotating inner ring — brand primary emerald tint */}
            {motionOn && !lowPower && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-6%] -z-10 rounded-full"
                style={{
                  opacity: 0.35 + 0.35 * intensity,
                  background:
                    "conic-gradient(from 180deg, transparent 0deg, color-mix(in oklab, var(--gold) 65%, white) 90deg, transparent 200deg, color-mix(in oklab, var(--primary) 55%, transparent) 280deg, transparent 360deg)",
                  filter: `blur(${innerBlur}px)`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 22 * speedFactor, repeat: Infinity, ease: "linear" }}
              />
            )}
            {/* Floating logo — subtle bob + luxurious hover lift */}
            <motion.span
              className="relative inline-flex transition-[filter] duration-500 ease-out group-hover/logo:drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--gold)_55%,transparent)]"
              animate={motionOn ? { y: [0, -4, 0] } : undefined}
              transition={{ duration: 6 * speedFactor, repeat: Infinity, ease: "easeInOut" }}
              whileHover={motionOn ? { y: -3 } : undefined}
            >
              <Logo light={!scrolled} />
            </motion.span>
            {/* Orbiting spark — skipped on low-power */}
            {motionOn && !lowPower && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-1.5 w-1.5 rounded-full"
                style={{
                  transformOrigin: "0 0",
                  background: "var(--gold)",
                  boxShadow: "0 0 10px 3px color-mix(in oklab, var(--gold) 70%, transparent)",
                  opacity: 0.5 + 0.4 * intensity,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 7 * speedFactor, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute -left-[60px] -top-[2px] block h-1.5 w-1.5" />
              </motion.span>
            )}
          </motion.span>
        </Link>



        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/80 hover:text-white",
                pathname === l.to && (scrolled ? "text-foreground" : "text-white"),
              )}
              activeProps={{ className: scrolled ? "text-foreground" : "text-white" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle light={!scrolled} />
          <LangToggle light={!scrolled} />
          <Button
            asChild
            variant="hero"
            size="sm"
            className={cn(
              "transition-all duration-500",
              !scrolled && "shadow-[0_0_24px_-4px_rgba(201,168,76,0.55)] hover:shadow-[0_0_32px_-2px_rgba(201,168,76,0.8)]",
            )}
          >
            <Link to="/quote">{t.nav.quote}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle light={!scrolled} />
          <LangToggle light={!scrolled} />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className={cn(!scrolled && "text-white hover:bg-white/10 hover:text-white")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
                    activeProps={{ className: "bg-accent text-primary" }}
                    activeOptions={{ exact: l.to === "/" }}
                  >
                    {l.label}
                  </Link>
                ))}
                <Button asChild variant="hero" className="mt-4">
                  <Link to="/quote" onClick={() => setOpen(false)}>
                    {t.nav.quote}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


