import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { servicesPublishedQueryOptions } from "@/hooks/useServiceContent";
import { useLocalized } from "@/i18n/LanguageProvider";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Dynamic activity strip: horizontally scrollable row of service thumbnails
 * linking to each service page. Reads from the database (published services).
 */
export function ServicesStrip({ className, variant = "light" }: Props) {
  const L = useLocalized();
  const dark = variant === "dark";
  const { data } = useQuery(servicesPublishedQueryOptions);
  const items = (data ?? []).filter((s) => Boolean(s.slug_en));
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "w-full border-y",
        dark ? "border-white/10 bg-black/40 backdrop-blur" : "border-border/60 bg-background/80 backdrop-blur",
        className,
      )}
      role="navigation"
      aria-label="Services quick nav"
    >
      <div className="mx-auto max-w-7xl overflow-x-auto px-3 sm:px-6 lg:px-8">
        <ul className="flex snap-x snap-mandatory items-center gap-3 py-3">
          {items.map((s) => {
            const title = L({ en: s.title_en, ar: s.title_ar ?? s.title_en });
            const alt = L({ en: s.alt_en ?? s.title_en, ar: s.alt_ar ?? s.title_ar ?? s.title_en });
            return (
              <li key={s.id} className="snap-start shrink-0">
                <Link
                  to="/services/$slug"
                  params={{ slug: s.slug_en }}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl border px-2 py-1.5 pr-4 transition-all",
                    dark
                      ? "border-white/10 bg-white/5 text-white hover:border-[var(--gold)]/60 hover:bg-white/10"
                      : "border-border/60 bg-card hover:border-primary/50 hover:shadow-soft",
                  )}
                >
                  <span className="relative block h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {s.cover_image ? (
                      <img
                        src={s.cover_image}
                        alt={alt}
                        loading="lazy"
                        decoding="async"
                        sizes="56px"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-secondary text-primary">
                        <Icon name={s.icon || "Goal"} className="h-4 w-4" />
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-semibold sm:text-sm">{title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
