import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { Search, ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";
import { servicesPublishedQueryOptions, type ServiceRow } from "@/hooks/useServiceContent";

function scoreService(s: ServiceRow, q: string, ar: boolean): number {
  if (!q) return 0;
  const hay = [
    s.title_en,
    s.title_ar,
    s.description_en,
    s.description_ar,
    s.category,
    s.slug,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const needle = q.toLowerCase().trim();
  if (!needle) return 0;
  if (hay.includes(needle)) return 10;
  const tokens = needle.split(/\s+/).filter(Boolean);
  return tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
}

function slugSimilarity(slug: string, target: string): number {
  const a = slug.toLowerCase();
  const b = target.toLowerCase();
  const aTokens = new Set(a.split(/[-_/]+/).filter(Boolean));
  const bTokens = new Set(b.split(/[-_/]+/).filter(Boolean));
  let shared = 0;
  aTokens.forEach((t) => bTokens.has(t) && (shared += 1));
  return shared;
}

export function ServiceNotFound() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const params = useParams({ strict: false }) as { slug?: string };
  const missingSlug = params.slug ?? "";
  const [q, setQ] = useState("");

  const { data: services = [] } = useQuery(servicesPublishedQueryOptions);

  const suggestions = useMemo(() => {
    if (q.trim()) {
      return [...services]
        .map((s) => ({ s, score: scoreService(s, q, ar) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((x) => x.s);
    }
    // Fallback: related-by-slug tokens, otherwise first six
    const ranked = [...services]
      .map((s) => ({ s, score: slugSimilarity(s.slug, missingSlug) }))
      .sort((a, b) => b.score - a.score);
    return ranked.slice(0, 6).map((x) => x.s);
  }, [services, q, ar, missingSlug]);

  const heading = ar ? "لم نجد هذه الخدمة" : "We couldn't find that service";
  const body = ar
    ? "ربما تم نقل الرابط أو تعديله. ابحث بالأسفل أو تصفّح خدمات مقترحة."
    : "The link may have moved. Search below or explore related services.";
  const searchLabel = ar ? "ابحث في الخدمات" : "Search services";
  const relatedLabel = q.trim()
    ? ar ? "نتائج البحث" : "Search results"
    : ar ? "خدمات ذات صلة" : "Related services";
  const noResults = ar ? "لا توجد نتائج مطابقة." : "No matching services.";
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16 md:py-24">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm font-medium text-muted-foreground">404</span>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">{heading}</h1>
          <p className="max-w-xl text-sm text-muted-foreground md:text-base">{body}</p>
        </header>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            style={{ [ar ? "right" : "left"]: "0.75rem" } as React.CSSProperties}
            aria-hidden
          />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className={ar ? "pr-10" : "pl-10"}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {relatedLabel}
          </h2>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{noResults}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {suggestions.map((s) => {
                const title = ar ? (s.title_ar ?? s.title_en) : s.title_en;
                const desc = ar ? (s.description_ar ?? s.description_en) : s.description_en;
                return (
                  <li key={s.id}>
                    <Link
                      to="/services/$slug"
                      params={{ slug: s.slug }}
                      search={ar ? { lang: "ar" as const } : {}}
                      className="group flex h-full items-start justify-between gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary/60 hover:bg-accent/40"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground group-hover:text-primary">
                          {title}
                        </span>
                        {desc ? (
                          <span className="line-clamp-2 text-xs text-muted-foreground">{desc}</span>
                        ) : null}
                      </div>
                      <Arrow className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild variant="hero">
            <Link to="/services" search={ar ? { lang: "ar" as const } : {}}>
              {t.common.backToServices}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/" search={ar ? { lang: "ar" as const } : {}}>
              {t.common.backHome}
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
