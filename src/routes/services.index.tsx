import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroServices from "@/assets/hero-services.jpg.asset.json";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { ServiceRowSkeleton } from "@/components/site/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";
import {
  servicesPageQueryOptions,
  servicesCategoriesQueryOptions,
  useServicesPage,
} from "@/hooks/useServiceContent";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";

const SITE_URL = "https://zenith-arena-build.lovable.app";
const DEFAULT_PAGE_SIZE = 9;

type SortKey = "featured" | "newest" | "oldest" | "az" | "za";
type Search = { q?: string; category?: string; page?: number; lang?: "en" | "ar"; sort?: SortKey };

const SORT_KEYS: readonly SortKey[] = ["featured", "newest", "oldest", "az", "za"] as const;

export const Route = createFileRoute("/services/")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const q = typeof raw.q === "string" && raw.q.trim() ? raw.q.trim().slice(0, 120) : undefined;
    const category = typeof raw.category === "string" && raw.category.trim() ? raw.category.trim().slice(0, 80) : undefined;
    const pageN = typeof raw.page === "number" ? raw.page : typeof raw.page === "string" ? Number(raw.page) : undefined;
    const page = Number.isFinite(pageN) && (pageN as number) > 1 ? Math.floor(pageN as number) : undefined;
    const lang = raw.lang === "ar" || raw.lang === "en" ? raw.lang : undefined;
    const sort = typeof raw.sort === "string" && (SORT_KEYS as readonly string[]).includes(raw.sort) ? (raw.sort as SortKey) : undefined;
    return { q, category, page, lang, sort };
  },
  loaderDeps: ({ search }) => ({ q: search.q, category: search.category, page: search.page, sort: search.sort, lang: search.lang }),
  loader: async ({ context: { queryClient }, deps }) => {
    await Promise.all([queryClient.ensureQueryData(
      servicesPageQueryOptions({ q: deps.q, category: deps.category, page: deps.page ?? 1, pageSize: DEFAULT_PAGE_SIZE, sort: deps.sort, lang: deps.lang }),
    ), queryClient.ensureQueryData(servicesCategoriesQueryOptions)]);
  },
  component: ServicesPage,

  head: () => ({
    meta: [
      { title: "Sports Construction Services — Egytic Sports" },
      {
        name: "description",
        content:
          "Turnkey sports construction services: football pitches, athletics tracks, indoor arenas, tennis and padel courts, aquatic centres and stadium maintenance across Egypt and the region.",
      },
      { property: "og:title", content: "Sports Construction Services — Egytic" },
      {
        property: "og:description",
        content:
          "Design, build and maintain elite sports facilities — engineered to international standards by Egytic Sports.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/services` },
      { property: "og:image", content: heroServices.url },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { property: "og:image:alt", content: "Illuminated sports complex at dusk" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sports Construction Services — Egytic" },
      { name: "twitter:description", content: "Turnkey design-build for elite sports facilities." },
      { name: "twitter:image", content: heroServices.url },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/services` },
      { rel: "alternate", hrefLang: "en", href: `${SITE_URL}/services` },
      { rel: "alternate", hrefLang: "ar", href: `${SITE_URL}/services?lang=ar` },
      { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}/services` },
      { rel: "preload", as: "image", href: heroServices.url },
    ],
  }),
});

function ServicesPage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const page = search.page ?? 1;
  const sort: SortKey = search.sort ?? "featured";
  const { data, loading, fetching } = useServicesPage({
    q: search.q,
    category: search.category,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    sort,
    lang,
  });
  const cats = useQuery(servicesCategoriesQueryOptions).data ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [qLocal, setQLocal] = useState(search.q ?? "");
  useEffect(() => { setQLocal(search.q ?? ""); }, [search.q]);

  const rows = data?.rows ?? [];
  const hasFilters = Boolean(search.q || search.category || search.sort);


  const setSearch = (next: Partial<Search>) => {
    navigate({
      search: (prev: Search) => {
        const merged: Search = { ...prev, ...next };
        if (!merged.q) delete merged.q;
        if (!merged.category) delete merged.category;
        if (!merged.sort || merged.sort === "featured") delete merged.sort;
        if (!merged.page || merged.page < 2) delete merged.page;
        return merged;
      },
      replace: true,
    });
  };


  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch({ q: qLocal.trim() || undefined, page: undefined });
  };

  const L = t.servicesList;
  const copy = useMemo(
    () => ({
      searchPh: L.searchPh,
      all: L.all,
      results: (n: number) => `${n} ${L.resultsSuffix}`,
      empty: L.empty,
      clear: L.clear,
      prev: L.prev,
      next: L.next,
      pageOf: (a: number, b: number) => `${L.pageWord} ${a} ${L.ofWord} ${b}`,
      view: L.view,
      sort: L.sort,
      sortLabels: {
        featured: L.sortFeatured,
        newest: L.sortNewest,
        oldest: L.sortOldest,
        az: L.sortAz,
        za: L.sortZa,
      } as Record<SortKey, string>,
    }),
    [L],
  );


  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.services} title={t.sections.servicesTitle} subtitle={t.sections.servicesSub} bgImage={heroServices.url} />

      <section className="border-b bg-secondary/30 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <form onSubmit={submitSearch} className="relative flex-1 md:max-w-lg" role="search">
            <label htmlFor="services-search" className="sr-only">{copy.searchPh}</label>
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              id="services-search"
              type="search"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder={copy.searchPh}
              className="ps-9"
            />
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="services-cat" className="sr-only">{copy.all}</label>
            <select
              id="services-cat"
              value={search.category ?? ""}
              onChange={(e) => setSearch({ category: e.target.value || undefined, page: undefined })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{copy.all}</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label htmlFor="services-sort" className="sr-only">{copy.sort}</label>
            <select
              id="services-sort"
              value={sort}
              onChange={(e) => setSearch({ sort: (e.target.value as SortKey) || undefined, page: undefined })}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={copy.sort}
            >
              {SORT_KEYS.map((k) => (
                <option key={k} value={k}>{copy.sortLabels[k]}</option>
              ))}
            </select>
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={() => { setQLocal(""); setSearch({ q: undefined, category: undefined, sort: undefined, page: undefined }); }}>

                <X className="h-4 w-4" /> {copy.clear}
              </Button>
            )}
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {copy.results(total)}
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading && !data ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <ServiceRowSkeleton key={i} />)}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{copy.empty}</p>
          ) : (
            <div className={`grid gap-8 md:grid-cols-2 lg:grid-cols-3 ${fetching ? "opacity-70 transition-opacity" : ""}`}>
              {rows.map((s) => {
                const title = (ar ? s.title_ar : s.title_en) || s.title_en;
                const desc = (ar ? s.description_ar : s.description_en) || s.description_en || "";
                const alt = (ar ? s.alt_ar : s.alt_en) || title;
                return (
                  <Reveal key={s.id}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-soft transition-shadow hover:shadow-elegant">
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        {s.cover_image ? (
                          <ResponsiveImage
                            src={s.cover_image}
                            variants={s.cover_image_variants}
                            alt={alt}
                            width={800}
                            height={600}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary via-secondary/60 to-primary/20" role="img" aria-label={alt}>
                            <Icon name={s.icon || "Goal"} className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute start-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-primary shadow-soft backdrop-blur">
                          <Icon name={s.icon || "Goal"} className="h-5 w-5" />
                        </div>
                        {s.category && (
                          <span className="absolute end-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h2 className="text-xl font-bold text-foreground">{title}</h2>
                        {desc && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{desc}</p>}
                        <Button asChild variant="hero" className="mt-6 self-start">
                          <Link to="/services/$slug" params={{ slug: s.slug_en }}>
                            {copy.view}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setSearch({ page: page - 1 <= 1 ? undefined : page - 1 })}>
                {copy.prev}
              </Button>
              <span className="text-sm text-muted-foreground">{copy.pageOf(page, totalPages)}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setSearch({ page: page + 1 })}>
                {copy.next}
              </Button>
            </nav>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
