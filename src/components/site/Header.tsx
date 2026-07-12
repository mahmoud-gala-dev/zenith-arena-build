import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Youtube, MessageCircle, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { QuickLeadDialog } from "./QuickLeadDialog";

import { useBranding, DEFAULT_LOGO_MOTION } from "@/hooks/useBranding";

import { useLang } from "@/i18n/LanguageProvider";
import { useContactInfo, useSocialLinks, toWhatsAppNumber } from "@/lib/settings";
import { menusByLocationQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";


export function Header() {
  const { t, lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: branding } = useBranding();
  const contact = useContactInfo();
  const social = useSocialLinks();
  const ar = lang === "ar";

  const lowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency ?? 8;
    return (mem !== undefined && mem <= 4) || cores <= 4;
  }, []);

  const motionCfg = branding?.logo_motion?.[lang] ?? DEFAULT_LOGO_MOTION;
  const motionOn = !reduceMotion && motionCfg.enabled;
  const intensity = Math.max(0, Math.min(100, motionCfg.intensity)) / 100;
  const speedFactor = 0.5 + (100 - Math.max(0, Math.min(100, motionCfg.speed))) / 50;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: menuItems } = useQuery(menusByLocationQueryOptions("header"));
  const fallbackLinks = [
    { to: "/", label: t.nav.home },
    { to: "/services", label: t.nav.services },
    { to: "/projects", label: t.nav.projects },
    { to: "/products", label: t.nav.products },
    { to: "/gallery", label: ar ? "معرض الصور" : "Gallery" },
    { to: "/knowledge", label: t.nav.knowledge },
    { to: "/about", label: t.nav.about },
    { to: "/contact", label: t.nav.contact },
  ];
  const links = (menuItems && menuItems.length
    ? menuItems.map((m) => ({ to: m.href, label: ar ? m.label_ar || m.label_en : m.label_en }))
    : fallbackLinks);

  const wa = toWhatsAppNumber(social.whatsapp || contact.whatsapp);
  const topSocials = [
    social.facebook && { href: social.facebook, Icon: Facebook, name: "Facebook" },
    social.instagram && { href: social.instagram, Icon: Instagram, name: "Instagram" },
    social.linkedin && { href: social.linkedin, Icon: Linkedin, name: "LinkedIn" },
    social.youtube && { href: social.youtube, Icon: Youtube, name: "YouTube" },
    wa && { href: `https://wa.me/${wa}`, Icon: MessageCircle, name: "WhatsApp" },
  ].filter(Boolean) as { href: string; Icon: typeof Facebook; name: string }[];

  const officeLine = contact.offices
    ?.map((o) => (ar ? o.city_ar || o.city_en : o.city_en))
    .filter(Boolean)
    .join(" · ");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden md:block transition-all duration-500 ease-out",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] text-foreground"
          : "text-white",
      )}
    >
      {/* Ambient gradient overlay when at top */}
      {!scrolled && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-black/70 via-black/35 to-transparent" />
      )}

      {/* Utility top bar */}
      <div
        className={cn(
          "relative overflow-hidden border-b transition-all duration-500 ease-out",
          scrolled
            ? "max-h-0 border-transparent opacity-0"
            : "max-h-12 border-white/10 opacity-100",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-5 text-white/85">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-[color:var(--gold)]">
                <Phone className="h-3.5 w-3.5" />
                <span dir="ltr" className="tabular-nums">{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="hidden items-center gap-1.5 transition-colors hover:text-[color:var(--gold)] sm:inline-flex">
                <Mail className="h-3.5 w-3.5" />
                <span>{contact.email}</span>
              </a>
            )}
            {officeLine && (
              <span className="hidden min-w-0 items-center gap-1.5 truncate text-white/70 lg:inline-flex">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{officeLine}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {topSocials.length > 0 && (
              <div className="flex items-center gap-2">
                {topSocials.map(({ href, Icon, name }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={name}
                    className="text-white/70 transition-colors hover:text-[color:var(--gold)]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
            <div className="h-3.5 w-px bg-white/20" />
            <ThemeToggle light />
            <LangToggle light />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out",
          scrolled ? "h-20 lg:h-24" : "h-24 lg:h-28",
        )}
      >
        <Link to="/" aria-label="Egytic home" className="group relative inline-flex items-center">
          <motion.span
            initial={motionOn ? { opacity: 0, scale: 0.85, filter: "blur(6px)" } : { opacity: 0 }}
            animate={motionOn ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            whileHover={motionOn ? { scale: 1.04 } : undefined}
            className={cn(
              "relative inline-flex items-center justify-center will-change-transform",
              "[&_img]:!h-14 sm:[&_img]:!h-16 lg:[&_img]:!h-20 xl:[&_img]:!h-24",
            )}
          >
            {motionOn && !lowPower && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-[-14%] -z-10 rounded-full"
                style={{
                  opacity: 0.4 + 0.3 * intensity,
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--gold) 70%, transparent) 80deg, transparent 160deg, color-mix(in oklab, var(--primary) 55%, transparent) 240deg, transparent 340deg)",
                  filter: "blur(14px)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 16 * speedFactor, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="relative inline-flex transition-[filter] duration-500 ease-out group-hover:drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--gold)_60%,transparent)]">
              <Logo light={!scrolled} />
            </span>
          </motion.span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "group/link relative rounded-md px-3 py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors",
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-white/85 hover:text-white",
                  active && (scrolled ? "text-foreground" : "text-white"),
                )}
                activeOptions={{ exact: l.to === "/" }}
              >
                <span className="relative">
                  {l.label}
                  <span
                    className={cn(
                      "pointer-events-none absolute -bottom-1.5 left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-[color:var(--gold)] transition-transform duration-300 ease-out group-hover/link:scale-x-100",
                      active && "scale-x-100",
                    )}
                  />
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className={cn(
                "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors xl:inline-flex",
                scrolled
                  ? "border-border text-foreground hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                  : "border-white/25 text-white hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]",
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              <span dir="ltr" className="tabular-nums">{contact.phone}</span>
            </a>
          )}
          <Button
            asChild
            variant="hero"
            size="sm"
            className={cn(
              "h-10 rounded-full px-5 transition-all duration-500",
              !scrolled && "shadow-[0_0_28px_-4px_rgba(201,168,76,0.6)] hover:shadow-[0_0_36px_-2px_rgba(201,168,76,0.85)]",
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
            <SheetContent side={ar ? "left" : "right"} className="w-80 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-6">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-1">
                    {links.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
                        activeProps={{ className: "bg-accent text-primary" }}
                        activeOptions={{ exact: l.to === "/" }}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </nav>
                <div className="border-t border-border p-4 space-y-3">
                  <Button asChild variant="hero" className="w-full rounded-full">
                    <Link to="/quote" onClick={() => setOpen(false)}>
                      {t.nav.quote}
                    </Link>
                  </Button>
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-[color:var(--gold)]"
                    >
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{contact.phone}</span>
                    </a>
                  )}
                  {topSocials.length > 0 && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {topSocials.map(({ href, Icon, name }) => (
                        <a
                          key={name}
                          href={href}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={name}
                          className="text-muted-foreground transition-colors hover:text-[color:var(--gold)]"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
