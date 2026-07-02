import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, ShieldCheck, Cpu, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Reveal } from "@/components/site/Reveal";
import { ServiceCard, ProjectCard, ArticleCard } from "@/components/site/Cards";
import { HeroSlider } from "@/components/site/HeroSlider";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import ogImage from "@/assets/apex-og.jpg.asset.json";
import {
  services,
  projects,
  articles,
  testimonials,
  clients as fallbackClients,
  heroStats,
  heroImg,
  type ClientLogo,
} from "@/lib/site-data";

type DbClient = {
  id: string;
  name_en: string;
  name_ar: string;
  logo_url: string | null;
  industry: string | null;
  description_en: string | null;
  description_ar: string | null;
};

type TrustClient = ClientLogo & { logo_url?: string | null; description?: { en: string; ar: string } };

function monogramFor(name: string): string {
  return name
    .replace(/[^A-Za-z\u0600-\u06FF ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || name.slice(0, 2).toUpperCase();
}

const ACCENTS = ["#c9a84c", "#0f766e", "#1e40af", "#b91c1c", "#7c3aed", "#0369a1", "#a16207", "#065f46"];


export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: ogImage.url },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Egytic Sports — Sports Construction & Infrastructure" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage.url },
      { name: "twitter:image:alt", content: "Egytic Sports" },
    ],
  }),
});


const whyIcons = [ShieldCheck, Cpu, Wrench, Award];

function Index() {
  const { t } = useLang();
  const L = useLocalized();

  const { data: dbClients } = useQuery({
    queryKey: ["home-clients"],
    queryFn: async (): Promise<DbClient[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name_en,name_ar,logo_url,industry,description_en,description_ar")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .limit(18);
      if (error) throw error;
      return (data ?? []) as DbClient[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const clients: TrustClient[] =
    dbClients && dbClients.length > 0
      ? dbClients.map((c, i) => ({
          name: { en: c.name_en, ar: c.name_ar },
          sector: { en: c.industry ?? "Client", ar: c.industry ?? "عميل" },
          monogram: monogramFor(c.name_en),
          accent: ACCENTS[i % ACCENTS.length],
          logo_url: c.logo_url,
          description: { en: c.description_en ?? "", ar: c.description_ar ?? "" },
        }))
      : fallbackClients;



  return (
    <SiteLayout>
      <HeroSlider
        fallback={
          <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink">
            <img src={heroImg} alt="Stadium at dusk" className="absolute inset-0 h-full w-full object-cover opacity-55" width={1920} height={1280} />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" />
            <div className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                  {t.hero.eyebrow}
                </span>
                <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl">
                  {t.hero.title1} <span className="text-gradient-gold">{t.hero.title2}</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg text-white/70">{t.hero.subtitle}</p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild variant="gold" size="xl">
                    <Link to="/contact">{t.cta.getConsultation}<ArrowRight className="h-5 w-5 rtl:rotate-180" /></Link>
                  </Button>
                  <Button asChild variant="outlineLight" size="xl">
                    <Link to="/projects">{t.cta.explore}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        }
      />

      {/* Stats strip */}
      <section className="border-b border-border bg-ink py-10 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {heroStats.map((s) => (
            <div key={s.key}>
              <p className="text-3xl font-bold sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-white/60">{t.hero[s.key]}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Services */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t.nav.services}
            title={t.sections.servicesTitle}
            subtitle={t.sections.servicesSub}
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={i * 60}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured projects */}
      <section className="bg-secondary/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader
              align="start"
              eyebrow={t.nav.projects}
              title={t.sections.projectsTitle}
              subtitle={t.sections.projectsSub}
            />
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/projects">
                {t.cta.viewAll}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((p, i) => (
              <Reveal key={p.slug} delay={i * 60}>
                <ProjectCard project={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why Apex */}
      <section className="relative overflow-hidden bg-hero py-24 text-white">
        <div className="absolute inset-0 grid-texture opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            light
            eyebrow={t.sections.whyTitle}
            title={t.sections.whyTitle}
            subtitle={t.sections.whySub}
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([
              [t.why.i1t, t.why.i1d],
              [t.why.i2t, t.why.i2d],
              [t.why.i3t, t.why.i3d],
              [t.why.i4t, t.why.i4d],
            ] as const).map(([title, desc], i) => {
              const IconCmp = whyIcons[i];
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground">
                      <IconCmp className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm text-white/70">{desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t.sections.processTitle}
            title={t.sections.processTitle}
            subtitle={t.sections.processSub}
          />
          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {([
              [t.process.s1t, t.process.s1d],
              [t.process.s2t, t.process.s2d],
              [t.process.s3t, t.process.s3d],
              [t.process.s4t, t.process.s4d],
            ] as const).map(([title, desc], i) => (
              <Reveal key={i} delay={i * 70} className="relative">
                <div className="text-5xl font-bold text-gradient">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader title={t.sections.testimonialsTitle} />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((tm, i) => (
              <Reveal key={i} delay={i * 70}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <div className="text-4xl leading-none text-primary/30">"</div>
                  <blockquote className="mt-2 flex-1 text-foreground/85">{L(tm.quote)}</blockquote>
                  <figcaption className="mt-6">
                    <p className="font-semibold text-foreground">{tm.name}</p>
                    <p className="text-sm text-muted-foreground">{L(tm.role)}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Clients — trusted by */}
      <section className="relative overflow-hidden border-y border-border bg-gradient-to-b from-background via-secondary/30 to-background py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--primary) 0, transparent 40%), radial-gradient(circle at 80% 60%, var(--gold) 0, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t.sections.clientsTitle}
            title={t.sections.clientsTitle}
            subtitle={t.sections.clientsSub}
          />
          <ul
            className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6"
            aria-label={t.sections.clientsTitle}
          >
            {clients.map((c, i) => (
              <Reveal key={c.monogram + i} delay={i * 40}>
                <li className="group relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/80 p-5 text-center shadow-soft backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-4 -top-16 h-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                    style={{ background: c.accent }}
                  />
                  <svg
                    viewBox="0 0 80 80"
                    className="h-14 w-14 shrink-0 drop-shadow-sm"
                    role="img"
                    aria-label={L(c.name)}
                  >
                    <defs>
                      <linearGradient id={`cg-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={c.accent} stopOpacity="0.95" />
                        <stop offset="100%" stopColor={c.accent} stopOpacity="0.55" />
                      </linearGradient>
                    </defs>
                    <rect x="2" y="2" width="76" height="76" rx="18" fill={`url(#cg-${i})`} />
                    <rect
                      x="2"
                      y="2"
                      width="76"
                      height="76"
                      rx="18"
                      fill="none"
                      stroke="rgba(255,255,255,0.35)"
                      strokeWidth="1.5"
                    />
                    <text
                      x="40"
                      y="47"
                      textAnchor="middle"
                      fontSize={c.monogram.length > 2 ? "22" : "28"}
                      fontWeight="800"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fill="#fff"
                      letterSpacing="1"
                    >
                      {c.monogram}
                    </text>
                  </svg>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground" title={L(c.name)}>
                      {L(c.name)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {L(c.sector)}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>


      {/* Knowledge preview */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeader
              align="start"
              eyebrow={t.nav.knowledge}
              title={t.sections.knowledgeTitle}
              subtitle={t.sections.knowledgeSub}
            />
            <Button asChild variant="outline" className="shrink-0">
              <Link to="/knowledge">
                {t.cta.viewAll}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {articles.slice(0, 3).map((a, i) => (
              <Reveal key={a.slug} delay={i * 60}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl bg-hero px-6 py-16 text-center shadow-elegant sm:px-16">
            <div className="absolute inset-0 grid-texture opacity-20" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold text-white sm:text-4xl">
                {t.sections.ctaTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">{t.sections.ctaSub}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="gold" size="xl">
                  <Link to="/contact">{t.cta.quote}</Link>
                </Button>
                <Button asChild variant="outlineLight" size="xl">
                  <Link to="/contact">{t.cta.getConsultation}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
