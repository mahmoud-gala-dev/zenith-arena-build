import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroImg from "@/assets/hero-projects.jpg";
import { Reveal } from "@/components/site/Reveal";
import { CardSkeleton } from "@/components/site/Skeletons";
import { VirtualCardGrid } from "@/components/site/VirtualCardGrid";
import { PerfProfiler } from "@/lib/perf";
import { cn } from "@/lib/utils";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import {
  governoratesActiveQueryOptions,
  projectsPublishedListQueryOptions,
  type Gov,
  type DbProject,
} from "@/lib/queries";



const searchSchema = z.object({
  gov: fallback(z.string(), "all").default("all"),
  category: fallback(z.string(), "all").default("all"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/projects/")({
  validateSearch: zodValidator(searchSchema),
  loader: ({ context: { queryClient } }) => {
    // Warm the cache in parallel while the route matches — the component
    // subscribes below and will hit the cache instantly.
    void queryClient.ensureQueryData(governoratesActiveQueryOptions);
    void queryClient.ensureQueryData(projectsPublishedListQueryOptions);
  },
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t, lang } = useLang();
  // L is unused now (all category labels come from DB text)

  const { gov, category, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/projects/" });
  const [qInput, setQInput] = useState(q);

  useEffect(() => { setQInput(q); }, [q]);

  const govsQuery = useQuery<Gov[]>(governoratesActiveQueryOptions);
  const projectsQuery = useQuery<DbProject[]>(projectsPublishedListQueryOptions);
  const govs = govsQuery.data ?? [];
  const dbProjects = projectsQuery.data ?? [];
  const dbLoading = govsQuery.isLoading || projectsQuery.isLoading;



  const govCounts = useMemo(() => {
    const m = new Map<string, number>();
    dbProjects.forEach((p) => { if (p.governorate_id) m.set(p.governorate_id, (m.get(p.governorate_id) ?? 0) + 1); });
    return m;
  }, [dbProjects]);

  const govBySlug = useMemo(() => new Map(govs.map((g) => [g.slug, g])), [govs]);
  const govById = useMemo(() => new Map(govs.map((g) => [g.id, g])), [govs]);
  const selectedGov = gov !== "all" ? govBySlug.get(gov) ?? null : null;
  const qLower = q.trim().toLowerCase();

  // Derive category chips from distinct sport_type values in DB.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of dbProjects) if (p.sport_type) set.add(p.sport_type);
    return Array.from(set).sort();
  }, [dbProjects]);

  const dbFiltered = useMemo(() => {
    let list = selectedGov ? dbProjects.filter((p) => p.governorate_id === selectedGov.id) : dbProjects;
    if (!selectedGov && category !== "all") list = list.filter((p) => p.sport_type === category);
    if (qLower) list = list.filter((p) => `${p.title_en} ${p.title_ar ?? ""} ${p.location ?? ""} ${p.sport_type ?? ""}`.toLowerCase().includes(qLower));
    return list;
  }, [dbProjects, selectedGov, category, qLower]);


  const setSearch = (patch: Partial<{ gov: string; category: string; q: string }>) =>
    navigate({ search: (prev: { gov: string; category: string; q: string }) => ({ ...prev, ...patch }) });

  const showingGov = gov !== "all";
  const hasAny = gov !== "all" || category !== "all" || q !== "";

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.projects} title={t.sections.projectsTitle} subtitle={t.sections.projectsSub} bgImage={heroImg} />

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch({ q: qInput.trim() }); }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={t.projects.searchPlaceholder}
                className="h-11 w-full rounded-full border border-border bg-card ps-10 pe-4 text-sm text-foreground shadow-soft outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <button type="submit" className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90">
              {t.projects.searchBtn}
            </button>
            {hasAny && (
              <button
                type="button"
                onClick={() => { setQInput(""); navigate({ search: { gov: "all", category: "all", q: "" } }); }}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-4 text-sm text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" /> {t.projects.resetBtn}
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">
            {t.projects.browseByGov}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <button
              onClick={() => setSearch({ gov: "all" })}
              className={cn(
                "flex min-h-[10.5rem] flex-col items-center justify-start gap-2 rounded-2xl border p-4 text-center transition-colors",
                gov === "all" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
              )}
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold text-foreground">EG</div>
              <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-foreground">{t.projects.allGovernorates}</div>
              <div className="min-h-[1rem] text-xs text-muted-foreground">{dbProjects.length} {t.projects.projectsCount}</div>

            </button>
            {govs.length === 0 && Array.from({ length: 11 }).map((_, i) => (
              <div key={`sk-${i}`} className="flex min-h-[10.5rem] flex-col items-center justify-start gap-2 rounded-2xl border border-border bg-card p-4" aria-hidden>
                <div className="h-14 w-14 shrink-0 rounded-full bg-secondary" />
                <div className="h-5 w-20 rounded bg-secondary" />
                <div className="h-4 w-14 rounded bg-secondary/70" />
              </div>
            ))}
            {govs.map((g) => {
              const count = govCounts.get(g.id) ?? 0;
              const active = gov === g.slug;
              return (
                <button
                  key={g.id}
                  onClick={() => setSearch({ gov: g.slug })}
                  className={cn(
                    "flex min-h-[10.5rem] flex-col items-center justify-start gap-2 rounded-2xl border p-4 text-center transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary">
                    {g.logo_url ? (
                      <img
                        src={g.logo_url}
                        alt={lang === "ar" ? g.name_ar : g.name_en}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>
                  <div className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-foreground">{lang === "ar" ? g.name_ar : g.name_en}</div>
                  <div className="min-h-[1rem] text-xs text-muted-foreground">{count} {t.projects.projectsCount}</div>
                </button>
              );
            })}

          </div>

        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!showingGov && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSearch({ category: "all" })}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  category === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                {t.projects.filterAll}
              </button>
              {categoryOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setSearch({ category: c })}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium capitalize transition-colors",
                    category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}


          {showingGov ? (
            <div className="mt-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {selectedGov?.logo_url && (
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary">
                      <img src={selectedGov.logo_url} alt="" width={40} height={40} className="h-full w-full object-contain p-1" decoding="async" />
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">
                    {t.projects.projectsIn} {selectedGov ? (lang === "ar" ? selectedGov.name_ar : selectedGov.name_en) : ""}
                  </h3>
                </div>
                {selectedGov && (
                  <Link to="/governorates/$slug" params={{ slug: selectedGov.slug }} className="text-sm font-medium text-primary hover:underline">
                    {t.projects.openGovPage}
                  </Link>
                )}
              </div>
              {dbLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : dbFiltered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                  {lang === "ar" ? "لا توجد مشاريع منشورة مطابقة." : "No published projects match."}
                </p>
              ) : (

                <PerfProfiler id="projects:db-grid">
                  <VirtualCardGrid
                    items={dbFiltered}
                    renderItem={(p, i) => (
                      <Reveal key={p.id} delay={Math.min(i * 40, 200)}>
                        <Link to="/projects/$slug" params={{ slug: p.slug_en }} className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                        {p.cover_image && (
                          <div className="aspect-[16/10] overflow-hidden bg-secondary">
                            <img src={p.cover_image} alt={lang === "ar" ? p.title_ar ?? p.title_en : p.title_en} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.sport_type ?? p.service_category}</div>
                          <div className="mt-1 text-base font-semibold text-foreground">{lang === "ar" ? p.title_ar ?? p.title_en : p.title_en}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {p.location}{p.year ? ` · ${p.year}` : ""}
                            {p.governorate_id && govById.get(p.governorate_id) && (
                              <span className="ms-1">· {lang === "ar" ? govById.get(p.governorate_id)!.name_ar : govById.get(p.governorate_id)!.name_en}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                    )}
                    className="mt-0"
                  />
                </PerfProfiler>
              )}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dbFiltered.length === 0 ? (
                <p className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                  {lang === "ar" ? "لا توجد نتائج مطابقة." : "No matching results."}
                </p>
              ) : dbFiltered.map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <Link to="/projects/$slug" params={{ slug: p.slug_en }} className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                    {p.cover_image && (
                      <div className="aspect-[16/10] overflow-hidden bg-secondary">
                        <img src={p.cover_image} alt={lang === "ar" ? p.title_ar ?? p.title_en : p.title_en} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.sport_type ?? p.service_category}</div>
                      <div className="mt-1 text-base font-semibold text-foreground">{lang === "ar" ? p.title_ar ?? p.title_en : p.title_en}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {p.location}{p.year ? ` · ${p.year}` : ""}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

        </div>
      </section>
    </SiteLayout>
  );
}
