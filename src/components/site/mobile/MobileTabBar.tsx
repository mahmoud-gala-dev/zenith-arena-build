import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Building2, Package, BookOpen, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageProvider";
import { useScrollIdle } from "@/hooks/useScrollIdle";

export function MobileTabBar({ onOpenMore }: { onOpenMore: () => void }) {
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scrolling = useScrollIdle(220);
  const hidden = scrolling;

  const ar = lang === "ar";
  const tabs = [
    { to: "/", icon: Home, label: ar ? "الرئيسية" : "Home", match: (p: string) => p === "/" },
    { to: "/projects", icon: Building2, label: ar ? "مشاريع" : "Projects", match: (p: string) => p.startsWith("/projects") },
    { to: "/products", icon: Package, label: ar ? "منتجات" : "Products", match: (p: string) => p.startsWith("/products") },
    { to: "/knowledge", icon: BookOpen, label: ar ? "معرفة" : "Knowledge", match: (p: string) => p.startsWith("/knowledge") },
  ] as const;

  const moreActive = !tabs.some((t) => t.match(pathname));

  return (
    <nav
      data-mobile-tabbar
      aria-label={ar ? "شريط التنقل" : "Bottom navigation"}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border/70 bg-background/90 backdrop-blur-xl",
        "transition-transform duration-300 ease-out",
        "pb-[env(safe-area-inset-bottom)]",
        hidden ? "translate-y-full" : "translate-y-0",
      )}
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 pt-1.5">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link
                to={t.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-all",
                  "active:scale-[0.94]",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className="leading-tight">{t.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            aria-label={ar ? "المزيد" : "More"}
            className={cn(
              "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-all",
              "active:scale-[0.94]",
              moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-9 w-14 place-items-center rounded-full transition-colors",
                moreActive && "bg-primary/12",
              )}
            >
              <Menu className={cn("h-5 w-5", moreActive && "text-primary")} strokeWidth={moreActive ? 2.4 : 2} />
            </span>
            <span className="leading-tight">{ar ? "المزيد" : "More"}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
