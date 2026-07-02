import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";

import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
          scrolled ? "h-20 sm:h-24 lg:h-24" : "h-24 sm:h-28 lg:h-32 xl:h-36",
        )}
      >
        <Link to="/" aria-label="Egytic home" className="inline-flex items-center">
          <span
            className={cn(
              "inline-block transition-transform duration-500 ease-out will-change-transform",
              scrolled ? "scale-90" : "scale-105",
            )}
          >
            <Logo light={!scrolled} />
          </span>
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

