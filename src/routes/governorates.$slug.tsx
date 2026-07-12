import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Gov = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  region_en: string | null;
  region_ar: string | null;
};

type P = {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string | null;
  location: string | null;
  year: number | null;
  sport_type: string | null;
  service_category: string | null;
  cover_image: string | null;
};

async function loadGovernorate(slug: string) {
  const { data: gov } = await supabase.from("governorates").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  if (!gov) throw notFound();
  const { data: projects } = await supabase
    .from("projects")
    .select("id,slug_en,title_en,title_ar,location,year,sport_type,service_category,cover_image")
    .eq("status", "published")
    .eq("governorate_id", (gov as Gov).id)
    .order("year", { ascending: false });
  return { gov: gov as Gov, projects: (projects ?? []) as P[] };
}

export const Route = createFileRoute("/governorates/$slug")({
  loader: ({ params }) => loadGovernorate(params.slug),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Governorate not found" }, { name: "robots", content: "noindex" }] };
    const g = loaderData.gov;
    const title = `${g.name_en} — Egytic Sport Projects`;
    const desc = `Sports construction projects delivered by Egytic across ${g.name_en}${g.region_en ? `, ${g.region_en}` : ""}, Egypt.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(g.logo_url ? [{ property: "og:image", content: g.logo_url }] : []),
      ],
    };
  },
  errorComponent: ({ error }) => <SiteLayout><div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">{error.message}</div></SiteLayout>,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Governorate not found</h1>
        <Link to="/projects" className="mt-4 inline-block text-primary hover:underline">← Back to projects</Link>
      </div>
    </SiteLayout>
  ),
  component: GovernoratePage,
});

function GovernoratePage() {
  const { gov, projects } = Route.useLoaderData() as { gov: Gov; projects: P[] };
  const { lang, t } = useLang();
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<string>("all");

  useEffect(() => { setQ(""); setSport("all"); }, [gov.id]);

  const sportOptions = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => { if (p.sport_type) s.add(p.sport_type); });
    return Array.from(s).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (sport !== "all" && p.sport_type !== sport) return false;
      if (!needle) return true;
      return `${p.title_en} ${p.title_ar ?? ""} ${p.location ?? ""} ${p.sport_type ?? ""}`.toLowerCase().includes(needle);
    });
  }, [projects, q, sport]);

  const name = lang === "ar" ? gov.name_ar : gov.name_en;
  const region = lang === "ar" ? gov.region_ar : gov.region_en;

  const brief = lang === "ar"
    ? `تنفيذ مشاريع منشآت رياضية متكاملة في محافظة ${gov.name_ar}${gov.region_ar ? ` (${gov.region_ar})` : ""}. نقدم حلولاً هندسية ورياضية معتمدة تشمل الملاعب، المضامير، الصالات المغطاة، وملاعب المضرب.`
    : `Egytic delivers turnkey sports facilities across ${gov.name_en}${gov.region_en ? ` (${gov.region_en})` : ""} — from certified football pitches and IAAF-grade tracks to indoor halls and tennis / padel courts.`;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-hero pt-32 pb-16 text-white">
        <div className="absolute inset-0 grid-texture opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: t.nav.home, to: "/" },
              { label: t.nav.projects, to: "/projects" },

              { label: name },
            ]}
          />
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {gov.logo_url && (
              <img src={gov.logo_url} alt={name} className="h-24 w-24 rounded-2xl bg-white/95 object-contain p-2 shadow-lift sm:h-28 sm:w-28" />
            )}
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {lang === "ar" ? "محافظة مصرية" : "Egyptian Governorate"}
              </span>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{name}</h1>
              {region && <p className="mt-1 text-sm text-white/70">{region}</p>}
              <p className="mt-3 max-w-2xl text-white/85">{brief}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  {projects.length} {lang === "ar" ? "مشروع منجز" : "delivered projects"}
                </span>
                {sportOptions.length > 0 && (
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {sportOptions.length} {lang === "ar" ? "نوع رياضة" : "sport types"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "ar" ? "بحث سريع…" : "Quick search…"}
                className="h-10 w-full rounded-full border border-border bg-card ps-10 pe-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            {sportOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSport("all")}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", sport === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent")}
                >
                  {lang === "ar" ? "الكل" : "All"}
                </button>
                {sportOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", sport === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                {lang === "ar" ? "لا توجد مشاريع مطابقة لهذه المحافظة بعد." : "No matching projects in this governorate yet."}
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => (
                  <Reveal key={p.id} delay={i * 40}>
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

          <div className="mt-12 text-center">
            <Link to="/projects" search={{ gov: gov.slug, category: "all", q: "" }} className="text-sm font-medium text-primary hover:underline">
              {lang === "ar" ? "عرض هذه المحافظة في صفحة المشاريع ←" : "View this governorate in projects filter →"}
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
