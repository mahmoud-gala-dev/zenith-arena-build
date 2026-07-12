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
import { useContactInfo, useSocialLinks, toWhatsAppNumber, useBrandName } from "@/lib/settings";
import { buildWhatsAppUrl, inferServiceFromPath } from "@/lib/whatsapp";
import { menusByLocationQueryOptions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";


export function Header() {
  const { t, lang } = useLang();
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadIntent, setLeadIntent] = useState<"callback" | "quote">("quote");
  const [leadSource, setLeadSource] = useState("header_cta");
  const openLead = (intent: "callback" | "quote", source: string) => {
    setLeadIntent(intent);
    setLeadSource(source);
    setLeadOpen(true);
  };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: branding } = useBranding();
  const contact = useContactInfo();
  const social = useSocialLinks();
  const brand = useBrandName();
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

  // Sticky header: rAF-throttled scroll listener that tracks direction,
  // condensed state, hide-on-scroll-down / show-on-scroll-up, page progress,
  // and pauses hiding when a menu/dialog is open or hovering near the top.
  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;
    const HIDE_AFTER = 240;
    const DELTA = 8;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, y / max)));
      setScrolled(y > 20);

      const diff = y - lastY;
      if (Math.abs(diff) < DELTA) return;
      if (open || leadOpen) {
        setHidden(false);
      } else if (y < HIDE_AFTER) {
        setHidden(false);
      } else if (diff > 0) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, leadOpen]);


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
  const buildWaHref = (surface: string) =>
    wa
      ? buildWhatsAppUrl(wa, {
          brand: ar ? brand.ar : brand.en,
          service: inferServiceFromPath(pathname, ar),
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
          phone: contact.phone,
          ar,
        })
      : "#";
  const handleWaClick = (surface: "top_bar" | "mobile") => {
    trackEvent({ name: "header_whatsapp_click", surface, number: wa });
  };
  const topSocials = [
    social.facebook && { href: social.facebook, Icon: Facebook, name: "Facebook" },
    social.instagram && { href: social.instagram, Icon: Instagram, name: "Instagram" },
    social.linkedin && { href: social.linkedin, Icon: Linkedin, name: "LinkedIn" },
    social.youtube && { href: social.youtube, Icon: Youtube, name: "YouTube" },
    wa && { href: buildWaHref("social"), Icon: MessageCircle, name: "WhatsApp", isWa: true },
  ].filter(Boolean) as { href: string; Icon: typeof Facebook; name: string; isWa?: boolean }[];

  const officeLine = contact.offices
    ?.map((o) => (ar ? o.city_ar || o.city_en : o.city_en))
    .filter(Boolean)
    .join(" · ");

  return (
    <header
      dir={ar ? "rtl" : "ltr"}
      data-scrolled={scrolled ? "true" : "false"}
      data-hidden={hidden ? "true" : "false"}
      className={cn(
        "fixed inset-x-0 top-0 z-50 hidden md:block will-change-transform",
        "transition-[transform,background-color,box-shadow,border-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "motion-reduce:transition-none",
        hidden ? "-translate-y-full" : "translate-y-0",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.35)] text-foreground supports-[backdrop-filter]:bg-background/70"
          : "border-b border-transparent text-white",
      )}
    >
      {/* Skip to content — a11y for keyboard users */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary",
          ar ? "focus:right-2" : "focus:left-2",
        )}
      >
        {ar ? "تخطي إلى المحتوى" : "Skip to content"}
      </a>

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
              <a
                href={`tel:${contact.phone}`}
                onClick={() => trackEvent({ name: "header_phone_click", surface: "top_bar", phone: contact.phone })}
                className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
                aria-label={ar ? `اتصل: ${contact.phone}` : `Call ${contact.phone}`}
              >
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                <span dir="ltr" className="tabular-nums">{contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="hidden items-center gap-1.5 rounded-sm transition-colors hover:text-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] sm:inline-flex"
                aria-label={ar ? `راسلنا: ${contact.email}` : `Email ${contact.email}`}
              >
                <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                <span>{contact.email}</span>
              </a>
            )}
            {officeLine && (
              <span className="hidden min-w-0 items-center gap-1.5 truncate text-white/70 lg:inline-flex">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{officeLine}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {topSocials.length > 0 && (
              <ul className="flex items-center gap-2" aria-label={ar ? "روابط التواصل الاجتماعي" : "Social links"}>
                {topSocials.map(({ href, Icon, name }) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${name} ${ar ? "(يفتح في نافذة جديدة)" : "(opens in new tab)"}`}
                      className="inline-flex rounded-sm text-white/70 transition-colors hover:text-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
                    >
                      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
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

        <nav aria-label={ar ? "التنقل الرئيسي" : "Primary"} className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "group/link relative rounded-md px-3 py-2 text-[13px] font-semibold tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  ar ? "text-sm" : "uppercase",
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
                      "pointer-events-none absolute -bottom-1.5 inset-x-0 h-[2px] scale-x-0 rounded-full bg-[color:var(--gold)] transition-transform duration-300 ease-out group-hover/link:scale-x-100",
                      ar ? "origin-right" : "origin-left",
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
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={ar ? "خيارات التواصل" : "Contact options"}
                  aria-haspopup="menu"
                  className={cn(
                    "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors xl:inline-flex",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    scrolled
                      ? "border-border text-foreground hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
                      : "border-white/25 text-white hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]",
                  )}
                >
                  <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                  <span dir="ltr" className="tabular-nums">{contact.phone}</span>
                  <ChevronDown aria-hidden="true" className="h-3 w-3 opacity-70" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2" dir={ar ? "rtl" : "ltr"}>
                <a
                  href={`tel:${contact.phone}`}
                  onClick={() => trackEvent({ name: "header_phone_click", surface: "main_bar", phone: contact.phone })}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Phone aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block">{ar ? "اتصل الآن" : "Call now"}</span>
                    <span dir="ltr" className="block text-[11px] font-normal text-muted-foreground">{contact.phone}</span>
                  </span>
                </a>
                {wa && (
                  <a
                    href={buildWaHref("top_bar")}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleWaClick("top_bar")}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                      <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block">WhatsApp</span>
                      <span className="block text-[11px] font-normal text-muted-foreground">{ar ? "دردشة فورية" : "Instant chat"}</span>
                    </span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => openLead("callback", "header_phone_popover")}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-sm font-semibold text-foreground transition hover:bg-accent"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block">{ar ? "اطلب مكالمة" : "Request callback"}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">{ar ? "نتصل بك خلال ساعات" : "We'll call you back"}</span>
                  </span>
                </button>
              </PopoverContent>
            </Popover>
          )}
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={() => {
              trackEvent({ name: "header_cta_click", surface: "main_bar", action: "open_dialog" });
              openLead("quote", "header_cta");
            }}
            className={cn(
              "h-10 rounded-full px-5 transition-all duration-500",
              !scrolled && "shadow-[0_0_28px_-4px_rgba(201,168,76,0.6)] hover:shadow-[0_0_36px_-2px_rgba(201,168,76,0.85)]",
            )}
          >
            {t.nav.quote}
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
                aria-label={open ? (ar ? "إغلاق القائمة" : "Close menu") : (ar ? "فتح القائمة" : "Open menu")}
                aria-expanded={open}
                aria-controls="mobile-nav-sheet"
                className={cn("min-h-11 min-w-11", !scrolled && "text-white hover:bg-white/10 hover:text-white")}
              >
                <Menu aria-hidden="true" className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              id="mobile-nav-sheet"
              side={ar ? "left" : "right"}
              className="w-80 p-0"
              dir={ar ? "rtl" : "ltr"}
            >
              <SheetTitle className="sr-only">{ar ? "قائمة التنقل" : "Navigation menu"}</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="border-b border-border p-6">
                  <Logo />
                </div>
                <nav
                  aria-label={ar ? "قائمة الموبايل" : "Mobile"}
                  className="flex-1 overflow-y-auto p-4"
                >
                  <ul className="flex flex-col gap-1">
                    {links.map((l) => (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          onClick={() => setOpen(false)}
                          className="block min-h-11 rounded-lg px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
                          activeProps={{ className: "bg-accent text-primary", "aria-current": "page" }}
                          activeOptions={{ exact: l.to === "/" }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-t border-border p-4 space-y-3">
                  <Button
                    type="button"
                    variant="hero"
                    className="min-h-11 w-full rounded-full"
                    onClick={() => {
                      trackEvent({ name: "header_cta_click", surface: "mobile", action: "open_dialog" });
                      setOpen(false);
                      openLead("quote", "header_mobile_cta");
                    }}
                  >
                    {t.nav.quote}
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={() => trackEvent({ name: "header_phone_click", surface: "mobile", phone: contact.phone })}
                        aria-label={ar ? `اتصل: ${contact.phone}` : `Call ${contact.phone}`}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Phone aria-hidden="true" className="h-4 w-4" />
                        <span dir="ltr">{ar ? "اتصل" : "Call"}</span>
                      </a>
                    )}
                    {wa && (
                      <a
                        href={buildWaHref("mobile")}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={() => handleWaClick("mobile")}
                        aria-label={`WhatsApp ${ar ? "(يفتح في نافذة جديدة)" : "(opens in new tab)"}`}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300"
                      >
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                  {topSocials.length > 0 && (
                    <ul
                      aria-label={ar ? "روابط التواصل الاجتماعي" : "Social links"}
                      className="flex items-center justify-center gap-2 pt-2"
                    >
                      {topSocials.map(({ href, Icon, name }) => (
                        <li key={name}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`${name} ${ar ? "(يفتح في نافذة جديدة)" : "(opens in new tab)"}`}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-[color:var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)]"
                          >
                            <Icon aria-hidden="true" className="h-5 w-5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Scroll progress indicator */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-[color:var(--gold)] via-[color:var(--primary)] to-[color:var(--gold)] transition-transform duration-150 ease-out"
          style={{
            transformOrigin: ar ? "right" : "left",
            transform: `scaleX(${progress})`,
          }}
        />
      </div>

      <QuickLeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        source={leadSource}
        intent={leadIntent}
      />
    </header>
  );
}
