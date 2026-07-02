import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { ProjectCard } from "@/components/site/Cards";
import { cn } from "@/lib/utils";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects, projectCategories } from "@/lib/site-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects/")({
  component: ProjectsPage,
});

type Gov = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  region_en: string | null;
  region_ar: string | null;
};

type DbProject = {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  location: string | null;
  year: number | null;
  sport_type: string | null;
  service_category: string | null;
  cover_image: string | null;
  governorate_id: string | null;
};

function ProjectsPage() {
  const { t, lang } = useLang();
  const L = useLocalized();
  const [filter, setFilter] = useState<string>("all");
  const [gov, setGov] = useState<string>("all");
  const [govs, setGovs] = useState<Gov[]>([]);
  const [dbProjects, setDbProjects] = useState<DbProject[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: g }, { data: p }] = await Promise.all([
        supabase.from("governorates").select("*").eq("active", true).order("sort_order"),
        supabase.from("projects").select("id,slug_en,title_en,title_ar,description_en,description_ar,location,year,sport_type,service_category,cover_image,governorate_id").eq("status", "published"),
      ]);
      setGovs((g ?? []) as Gov[]);
      setDbProjects((p ?? []) as DbProject[]);
    })();
  }, []);

  const govCounts = useMemo(() => {
    const m = new Map<string, number>();
    dbProjects.forEach((p) => { if (p.governorate_id) m.set(p.governorate_id, (m.get(p.governorate_id) ?? 0) + 1); });
    return m;
  }, [dbProjects]);

  const staticFiltered = filter === "all" ? projects : projects.filter((p) => p.category === filter);
  const dbFiltered = dbProjects.filter((p) => (gov === "all" ? true : p.governorate_id === gov));

  const showingGov = gov !== "all";

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.projects} title={t.sections.projectsTitle} subtitle={t.sections.projectsSub} />

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground">
            {lang === "ar" ? "تصفح المشاريع حسب المحافظة" : "Browse projects by governorate"}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <button
              onClick={() => setGov("all")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                gov === "all" ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
              )}
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-semibold text-foreground">EG</div>
              <div className="text-sm font-medium text-foreground">{lang === "ar" ? "كل المحافظات" : "All governorates"}</div>
              <div className="text-xs text-muted-foreground">{dbProjects.length} {lang === "ar" ? "مشروع" : "projects"}</div>
            </button>
            {govs.map((g) => {
              const count = govCounts.get(g.id) ?? 0;
              const active = gov === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setGov(g.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent",
                  )}
                >
                  {g.logo_url ? (
                    <img src={g.logo_url} alt={lang === "ar" ? g.name_ar : g.name_en} className="h-14 w-14 rounded-full bg-secondary object-contain p-1" loading="lazy" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-secondary" />
                  )}
                  <div className="text-sm font-medium text-foreground">{lang === "ar" ? g.name_ar : g.name_en}</div>
                  <div className="text-xs text-muted-foreground">{count} {lang === "ar" ? "مشروع" : "projects"}</div>
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
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  filter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                )}
              >
                {t.projects.filterAll}
              </button>
              {projectCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    filter === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
                  )}
                >
                  {L(c.label)}
                </button>
              ))}
            </div>
          )}

          {showingGov ? (
            <div className="mt-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {lang === "ar" ? "مشاريع في" : "Projects in"} {(() => { const g = govs.find((x) => x.id === gov); return g ? (lang === "ar" ? g.name_ar : g.name_en) : ""; })()}
                </h3>
                <button onClick={() => setGov("all")} className="text-sm text-primary hover:underline">
                  {lang === "ar" ? "إعادة تعيين" : "Reset"}
                </button>
              </div>
              {dbFiltered.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                  {lang === "ar" ? "لا توجد مشاريع منشورة في هذه المحافظة بعد." : "No published projects in this governorate yet."}
                </p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {dbFiltered.map((p, i) => (
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
                          <div className="mt-1 text-sm text-muted-foreground">{p.location}{p.year ? ` · ${p.year}` : ""}</div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {staticFiltered.map((p, i) => (
                <Reveal key={p.slug} delay={i * 50}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
