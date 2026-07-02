import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "../Logo";
import { LangToggle } from "../LangToggle";
import { ThemeToggle } from "../ThemeToggle";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// Contextual title per route section.
function useRouteTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { lang, t } = useLang();
  const ar = lang === "ar";
  if (pathname === "/") return "";
  if (pathname.startsWith("/projects")) return t.nav.projects;
  if (pathname.startsWith("/products")) return t.nav.products;
  if (pathname.startsWith("/services")) return t.nav.services;
  if (pathname.startsWith("/knowledge")) return t.nav.knowledge;
  if (pathname.startsWith("/gallery")) return ar ? "المعرض" : "Gallery";
  if (pathname.startsWith("/about")) return t.nav.about;
  if (pathname.startsWith("/contact")) return t.nav.contact;
  if (pathname.startsWith("/quote")) return t.nav.quote;
  if (pathname.startsWith("/clients")) return ar ? "العملاء" : "Clients";
  if (pathname.startsWith("/careers")) return ar ? "الوظائف" : "Careers";
  if (pathname.startsWith("/faq")) return ar ? "الأسئلة الشائعة" : "FAQ";
  if (pathname.startsWith("/downloads")) return ar ? "التحميلات" : "Downloads";
  if (pathname.startsWith("/certificates")) return ar ? "الشهادات" : "Certificates";
  if (pathname.startsWith("/governorates")) return ar ? "المحافظات" : "Governorates";
  if (pathname.startsWith("/privacy")) return ar ? "الخصوصية" : "Privacy";
  if (pathname.startsWith("/terms")) return ar ? "الشروط" : "Terms";
  return "";
}

export function MobileTopBar() {
  const [scrolled, setScrolled] = useState(false);
  const title = useRouteTitle();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 md:hidden",
        "transition-all duration-300",
        transparent
          ? "bg-transparent text-white"
          : "border-b border-border/70 bg-background/85 text-foreground backdrop-blur-xl",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 items-center justify-between gap-2 px-3">
        <Link to="/" aria-label="Home" className="flex items-center">
          <Logo light={transparent} size="h-12 w-auto max-w-[180px] object-contain select-none" />
        </Link>


        {title && !transparent && (
          <h1 className="pointer-events-none absolute left-1/2 max-w-[45%] -translate-x-1/2 truncate text-sm font-semibold">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-0.5">
          <Link
            to="/projects"
            aria-label="Search"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full transition-colors active:scale-95",
              transparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-accent",
            )}
          >
            <Search className="h-5 w-5" />
          </Link>
          <ThemeToggle light={transparent} />
          <LangToggle light={transparent} />
        </div>
      </div>
    </header>
  );
}
