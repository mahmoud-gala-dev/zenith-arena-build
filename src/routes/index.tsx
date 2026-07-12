import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Award, ShieldCheck, Cpu, Wrench, Trophy, Ruler, PlayCircle, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Reveal } from "@/components/site/Reveal";
import { HeroSlider } from "@/components/site/HeroSlider";
import { Icon } from "@/components/site/Icon";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { LangToggle } from "@/components/site/LangToggle";
import {
  heroSlidesActiveQueryOptions,
  homeClientsQueryOptions,
  projectsPublishedListQueryOptions,
  blogPostsPublishedQueryOptions,
  testimonialsPublishedQueryOptions,
  homeHeroSettingsQueryOptions,
  homepageSectionsQueryOptions,
  type HomeClient,
} from "@/lib/queries";
import { servicesPublishedQueryOptions } from "@/hooks/useServiceContent";

import ogImage from "@/assets/apex-og.jpg.asset.json";
import ctaLandmark from "@/assets/cta-landmark.jpg.asset.json";
import fallbackHeroImg from "@/assets/hero.jpg";



type TrustClient = { name: { en: string; ar: string }; sector: { en: string; ar: string }; monogram: string; accent: string; logo_url?: string | null; description?: { en: string; ar: string } };


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
  loader: ({ context: { queryClient } }) => {
    void queryClient.ensureQueryData(heroSlidesActiveQueryOptions("en"));
    void queryClient.ensureQueryData(heroSlidesActiveQueryOptions("ar"));
    void queryClient.ensureQueryData(homeClientsQueryOptions);
    void queryClient.ensureQueryData(servicesPublishedQueryOptions);
    void queryClient.ensureQueryData(homeHeroSettingsQueryOptions);
    void queryClient.ensureQueryData(homepageSectionsQueryOptions);
  },


  head: () => {
    const SITE_URL = "https://zenith-arena-build.lovable.app";
    const titleEn = "Egytic Sports — Sports Construction & Infrastructure";
    const titleAr = "إيجيتك سبورتس — إنشاءات وبنية تحتية رياضية";
    const descEn =
      "Egytic Sports designs and builds world-class sports facilities across Egypt — turf, tracks, courts and stadium infrastructure.";
    const descAr =
      "إيجيتك سبورتس تصمم وتنفذ منشآت رياضية عالمية المستوى في مصر — أعشاب صناعية، مضامير، ملاعب وبنية تحتية للاستادات.";
    const orgLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Egytic Sports",
      alternateName: "إيجيتك سبورتس",
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description: descEn,
      areaServed: { "@type": "Country", name: "Egypt" },
      sameAs: [] as string[],
    };
    const siteLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Egytic Sports",
      url: SITE_URL,
      inLanguage: ["en", "ar"],
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/knowledge?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };
    return {
      meta: [
        { title: `${titleEn} | ${titleAr}` },
        { name: "description", content: `${descEn} — ${descAr}` },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Egytic Sports" },
        { property: "og:url", content: `${SITE_URL}/` },
        { property: "og:title", content: titleEn },
        { property: "og:description", content: descEn },
        { property: "og:locale", content: "en_US" },
        { property: "og:locale:alternate", content: "ar_EG" },
        { property: "og:image", content: ogImage.url },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: titleEn },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titleEn },
        { name: "twitter:description", content: descEn },
        { name: "twitter:image", content: ogImage.url },
        { name: "twitter:image:alt", content: "Egytic Sports" },
      ],
      links: [
        { rel: "canonical", href: `${SITE_URL}/` },
        { rel: "alternate", hreflang: "en", href: `${SITE_URL}/` },
        { rel: "alternate", hreflang: "ar", href: `${SITE_URL}/?lang=ar` },
        { rel: "alternate", hreflang: "x-default", href: `${SITE_URL}/` },
        {
          rel: "preload",
          as: "image",
          href: ctaLandmark.url,
          fetchpriority: "high",
        },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgLd) },
        { type: "application/ld+json", children: JSON.stringify(siteLd) },
      ],
    };
  },
});


const whyIcons = [ShieldCheck, Cpu, Wrench, Award];

function Index() {
  const { t, lang } = useLang();
  const L = useLocalized();

  const { data: heroSettings } = useQuery(homeHeroSettingsQueryOptions);
  const heroImg = heroSettings?.hero_image_url || fallbackHeroImg;
  const heroStats = heroSettings?.stats ?? [];

  const { data: dbClients } = useQuery<HomeClient[]>(homeClientsQueryOptions);
  const { data: dbServices, isLoading: servicesLoading } = useQuery(servicesPublishedQueryOptions);
  const { data: dbProjects } = useQuery(projectsPublishedListQueryOptions);
  const { data: dbArticles } = useQuery(blogPostsPublishedQueryOptions);
  const { data: dbTestimonials } = useQuery(testimonialsPublishedQueryOptions);
  const { data: sectionsMap } = useQuery(homepageSectionsQueryOptions);

  // Resolve a homepage section header from DB with static-dict fallback.
  const section = (
    key: string,
    fallback: { title: string; subtitle?: string },
  ): { title: string; subtitle?: string } => {
    const row = sectionsMap?.[key];
    if (!row) return fallback;
    const title = (lang === "ar" ? row.title_ar : row.title_en) || fallback.title;
    const subtitleRaw = lang === "ar" ? row.subtitle_ar : row.subtitle_en;
    return { title, subtitle: subtitleRaw ?? fallback.subtitle };
  };


  const servicesList = dbServices ?? [];
  const withSlug = servicesList.filter((s) => Boolean(s.slug_en));
  const featuredServices = (withSlug.filter((s) => s.featured).length > 0
    ? withSlug.filter((s) => s.featured)
    : withSlug
  ).slice(0, 6);
  const homeProjects = (dbProjects ?? []).slice(0, 6);
  const homeArticles = (dbArticles ?? []).slice(0, 3);
  const homeTestimonials = (dbTestimonials ?? []).slice(0, 3);

  const clients: TrustClient[] =
    (dbClients ?? []).map((c, i) => ({
      name: { en: c.name_en, ar: c.name_ar },
      sector: { en: c.industry ?? "Client", ar: c.industry ?? "عميل" },
      monogram: monogramFor(c.name_en),
      accent: ACCENTS[i % ACCENTS.length],
      logo_url: c.logo_url,
      description: { en: c.description_en ?? "", ar: c.description_ar ?? "" },
    }));




  return (
    <SiteLayout>
      <HeroSlider
        fallback={
          <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink text-white">
            {/* Cinematic background */}
            <img
              src={heroImg}
              alt="Stadium at dusk"
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              width={1920}
              height={1280}
            />
            {/* Layered gradients matching header aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/55 to-ink" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent rtl:from-transparent rtl:to-ink/80" />
            {/* Subtle grid texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "56px 56px",
              }}
            />
            {/* Gold aura glows echoing header logo aura */}
            <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
            {/* Top & bottom hairlines echoing header */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
                {/* Left — heading */}
                <div className="lg:col-span-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {t.hero.eyebrow}
                  </span>
                  <h1 className="mt-6 font-display text-4xl font-bold leading-[1.02] text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
                    {t.hero.title1}
                    <span className="mt-2 block text-gradient-gold">{t.hero.title2}</span>
                  </h1>
                  <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                    {t.hero.subtitle}
                  </p>

                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    <Button asChild variant="gold" size="xl">
                      <Link to="/quote">
                        {t.cta.quote}
                        <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                      </Link>
                    </Button>
                    <Button asChild variant="outlineLight" size="xl">
                      <Link to="/projects">
                        {t.cta.explore}
                      </Link>
                    </Button>
                    <Link
                      to="/gallery"
                      className="group inline-flex items-center gap-2 px-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:text-white"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition group-hover:border-primary group-hover:bg-primary/10">
                        <PlayCircle className="h-4 w-4" />
                      </span>
                      {t.home.watchReel}
                    </Link>
                  </div>

                  {/* Trust chips */}
                  <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/55">
                    <li className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      {t.home.chipCertified}
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {t.home.chipWarranty}
                    </li>
                    <li className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      {t.home.chipTurnkey}

                    </li>
                  </ul>
                </div>

                {/* Right — CTA posters */}
                <div className="grid gap-4 lg:col-span-4">
                  <Link
                    to="/quote"
                    className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent p-5 backdrop-blur-sm transition hover:border-primary/60 hover:from-primary/35"
                  >
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-2xl transition group-hover:bg-primary/40" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
                          {t.home.posterQuoteEyebrow}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold text-white">
                          {t.cta.quote}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                          {t.home.posterQuoteDesc}
                        </p>

                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>

                  <Link
                    to="/projects"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
                          {t.home.posterPortfolioEyebrow}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold text-white">
                          {t.cta.explore}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                          {t.home.posterPortfolioDesc}

                        </p>
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition group-hover:border-primary group-hover:bg-primary/10">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>

                  <Link
                    to="/services"
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">
                          {t.home.posterServicesEyebrow}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-semibold text-white">
                          {t.home.posterServicesTitle}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                          {t.home.posterServicesDesc}

                        </p>
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition group-hover:border-primary group-hover:bg-primary/10">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
              <span className="inline-flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">
                {t.home.scroll}
                <ChevronDown className="h-4 w-4 animate-bounce text-primary/70" />
              </span>
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
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            {(() => { const s = section("featured_services", { title: t.sections.servicesTitle, subtitle: t.sections.servicesSub }); return (
            <SectionHeader
              align="start"
              eyebrow={t.nav.services}
              title={s.title}
              subtitle={s.subtitle}
            />); })()}

            <LangToggle />
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servicesLoading && featuredServices.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
                    aria-hidden
                  >
                    <div className="aspect-[16/10] w-full animate-pulse bg-secondary" />
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
                      <div className="h-3 w-full animate-pulse rounded bg-secondary/70" />
                      <div className="h-3 w-5/6 animate-pulse rounded bg-secondary/70" />
                      <div className="mt-6 h-4 w-24 animate-pulse rounded bg-secondary" />
                    </div>
                  </div>
                ))
              : featuredServices.length === 0
                ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {L({ en: "Services coming soon", ar: "الخدمات قادمة قريبًا" })}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {L({
                        en: "We're preparing our services catalog. Please check back shortly.",
                        ar: "نقوم بتحضير كتالوج الخدمات، يُرجى العودة قريبًا.",
                      })}
                    </p>
                    <Button asChild variant="outline" className="mt-6">
                      <Link to="/contact">{t.cta.getConsultation}</Link>
                    </Button>
                  </div>
                )
                : featuredServices.map((s, i) => {
                    const title = L({ en: s.title_en, ar: s.title_ar ?? s.title_en });
                    const desc = L({ en: s.description_en ?? "", ar: s.description_ar ?? s.description_en ?? "" });
                    const alt = L({ en: s.alt_en ?? s.title_en, ar: s.alt_ar ?? s.title_ar ?? s.title_en });
                    return (
                      <Reveal key={s.id} delay={i * 60}>
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug_en }}
                          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant focus-visible:-translate-y-1 focus-visible:shadow-elegant motion-reduce:transition-none"
                        >
                          <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                            {s.cover_image ? (
                              <ResponsiveImage
                                src={s.cover_image}
                                variants={s.cover_image_variants}
                                alt={alt}
                                width={800}
                                height={500}
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-primary/20">
                                <Icon name={s.icon || "Goal"} className="h-16 w-16 text-primary/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                            <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-primary shadow-soft backdrop-blur">
                              <Icon name={s.icon || "Goal"} className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                            {desc && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{desc}</p>}
                            <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                              {t.cta.learnMore}
                              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                            </span>
                          </div>
                        </Link>
                      </Reveal>
                    );
                  })}
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
            {homeProjects.map((p, i) => {
              const slug = p.slug_en;
              const title = L({ en: p.title_en, ar: p.title_ar ?? p.title_en });
              const loc = L({ en: p.location ?? p.city ?? p.country ?? "", ar: p.location ?? p.city ?? p.country ?? "" });
              const scope = L({ en: p.service_category ?? "", ar: p.service_category ?? "" });
              return (
                <Reveal key={p.id} delay={i * 60}>
                  <Link to="/projects/$slug" params={{ slug }} className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {p.cover_image && (
                        <img src={p.cover_image} alt={title} loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                      {p.year && (
                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink rtl:left-auto rtl:right-4">{p.year}</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        {loc && <p className="mt-1 text-sm text-white/70">{loc}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-5">
                      <span className="text-sm text-muted-foreground">{scope}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        {t.cta.viewProject}
                        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>


      {/* Why Egytic */}
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
            {homeTestimonials.map((tm, i) => (
              <Reveal key={tm.id} delay={i * 70}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft">
                  <div className="text-4xl leading-none text-primary/30">"</div>
                  <blockquote className="mt-2 flex-1 text-foreground/85">{L({ en: tm.quote_en, ar: tm.quote_ar ?? tm.quote_en })}</blockquote>
                  <figcaption className="mt-6">
                    <p className="font-semibold text-foreground">{L({ en: tm.name_en, ar: tm.name_ar ?? tm.name_en })}</p>
                    <p className="text-sm text-muted-foreground">{L({ en: tm.company_en ?? "", ar: tm.company_ar ?? tm.company_en ?? "" })}</p>
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
          <div
            role="list"
            className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6"
            aria-label={t.sections.clientsTitle}
          >
            {clients.map((c, i) => (
              <Reveal key={c.monogram + i} delay={i * 40}>
                <div role="listitem" className="group relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/80 p-5 text-center shadow-soft backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-4 -top-16 h-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                    style={{ background: c.accent }}
                  />
                  {c.logo_url ? (
                    <img
                      src={c.logo_url}
                      alt={L(c.name)}
                      loading="lazy"
                      decoding="async"
                      width={112}
                      height={112}
                      className="h-14 w-14 shrink-0 object-contain drop-shadow-sm"
                    />
                  ) : (
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
                      <rect x="2" y="2" width="76" height="76" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
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
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground" title={L(c.name)}>
                      {L(c.name)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {L(c.sector)}
                    </p>
                    {c.description && L(c.description) && (
                      <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground/80">{L(c.description)}</p>
                    )}
                  </div>

                </div>
              </Reveal>
            ))}
          </div>
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
            {homeArticles.map((a, i) => {
              const title = L({ en: a.title_en, ar: a.title_ar ?? a.title_en });
              const excerpt = L({ en: a.excerpt_en ?? "", ar: a.excerpt_ar ?? a.excerpt_en ?? "" });
              return (
                <Reveal key={a.id} delay={i * 60}>
                  <Link to="/knowledge/$slug" params={{ slug: a.slug_en }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {a.featured_image && (
                        <img src={a.featured_image} alt={title} loading="lazy" decoding="async" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">{title}</h3>
                      {excerpt && <p className="mt-2 flex-1 text-sm text-muted-foreground">{excerpt}</p>}
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        {t.cta.readArticle}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — full-bleed landmark */}
      <section
        className="relative isolate w-full min-h-[100svh] overflow-hidden bg-ink"
        aria-labelledby="cta-landmark-title"
      >
        <img
          src={ctaLandmark.url}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={1920}
          height={1280}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Readability overlay: darker at top/bottom to guarantee AA contrast on white text/buttons */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/55 to-ink/90"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]"
        />
        <div aria-hidden className="absolute inset-0 grid-texture opacity-15" />

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold drop-shadow">
              Egytic Sports
            </p>
            <h2
              id="cta-landmark-title"
              className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {t.sections.ctaTitle}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base text-white/90 drop-shadow sm:text-lg">
              {t.sections.ctaSub}
            </p>
            <div className="mt-10 flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="gold" size="xl" aria-label={t.cta.quote}>
                <Link to="/contact">{t.cta.quote}</Link>
              </Button>
              <Button asChild variant="outlineLight" size="xl" aria-label={t.cta.getConsultation}>
                <Link to="/contact">{t.cta.getConsultation}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>


    </SiteLayout>
  );
}
