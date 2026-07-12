import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Building2, Package, BookOpen, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n/LanguageProvider";
import { useScrollIdle } from "@/hooks/useScrollIdle";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useUiPrefs } from "@/hooks/useUiPrefs";
import { computeMobileNavVisibility, DEFAULT_IDLE_MS } from "@/lib/mobileNavVisibility";

export function MobileTabBar({ onOpenMore }: { onOpenMore: () => void }) {
  const { t: T } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reducedMotion = usePrefersReducedMotion();
  const { data: prefs } = useUiPrefs();
  const idleMs = prefs?.mobile_nav_idle_ms ?? DEFAULT_IDLE_MS;
  const scrolling = useScrollIdle(idleMs);
  const { hidden, transitionMs } = computeMobileNavVisibility({ scrolling, reducedMotion });

  const M = T.components.mobile;
  const tabs = [
    { to: "/", icon: Home, label: M.tabbar.home, match: (p: string) => p === "/" },
    { to: "/projects", icon: Building2, label: M.tabbar.projects, match: (p: string) => p.startsWith("/projects") },
    { to: "/products", icon: Package, label: M.tabbar.products, match: (p: string) => p.startsWith("/products") },
    { to: "/knowledge", icon: BookOpen, label: M.tabbar.knowledge, match: (p: string) => p.startsWith("/knowledge") },
  ] as const;

  const moreActive = !tabs.some((t) => t.match(pathname));

  return (
    <nav
      data-mobile-tabbar
      data-hidden={hidden ? "true" : "false"}
      aria-label={M.tabbar.ariaBottomNav}
      aria-hidden={hidden || undefined}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden will-change-transform",
        "border-t border-border/70 bg-background/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
        hidden
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100",
      )}
      style={{
        paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
        transitionProperty: "transform, opacity",
        transitionDuration: `${transitionMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
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
            aria-label={M.tabbar.more}
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
            <span className="leading-tight">{M.tabbar.more}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
