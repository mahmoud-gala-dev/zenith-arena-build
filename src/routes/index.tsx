import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Award, ShieldCheck, Cpu, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Reveal } from "@/components/site/Reveal";
import { ServiceCard, ProjectCard, ArticleCard } from "@/components/site/Cards";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import ogImage from "@/assets/apex-og.jpg.asset.json";
import {
  services,
  projects,
  articles,
  testimonials,
  clients,
  heroStats,
  heroImg,
} from "@/lib/site-data";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { property: "og:image", content: ogImage.url },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "APEX Sports — Sports Construction & Infrastructure" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage.url },
      { name: "twitter:image:alt", content: "APEX Sports" },
    ],
  }),
});


const whyIcons = [ShieldCheck, Cpu, Wrench, Award];

function Index() {
  const { t } = useLang();
  const L = useLocalized();

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink">
        <img
          src={heroImg}
          alt="Stadium at dusk"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" />
        <div className="absolute inset-0 grid-texture opacity-30" />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur"
              style={{ animation: "fade-up 0.7s ease-out both" }}
            >
              {t.hero.eyebrow}
            </span>
            <h1
              className="mt-6 text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl"
              style={{ animation: "fade-up 0.8s ease-out 0.1s both" }}
            >
              {t.hero.title1}{" "}
              <span className="text-gradient-gold">{t.hero.title2}</span>
            </h1>
            <p
              className="mt-6 max-w-xl text-lg text-white/70"
              style={{ animation: "fade-up 0.8s ease-out 0.2s both" }}
            >
              {t.hero.subtitle}
            </p>
            <div
              className="mt-9 flex flex-wrap gap-3"
              style={{ animation: "fade-up 0.8s ease-out 0.3s both" }}
            >
              <Button asChild variant="gold" size="xl">
                <Link to="/contact">
                  {t.cta.getConsultation}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild variant="outlineLight" size="xl">
                <Link to="/projects">{t.cta.explore}</Link>
              </Button>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {heroStats.map((s, i) => (
              <div key={s.key} style={{ animation: `fade-up 0.7s ease-out ${0.4 + i * 0.1}s both` }}>
                <p className="text-3xl font-bold text-white sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-white/60">{t.hero[s.key]}</p>
              </div>
            ))}
          </div>
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

      {/* Clients */}
      <section className="border-y border-border py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t.sections.clientsTitle}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {clients.map((c) => (
              <div
                key={c}
                className="flex items-center justify-center rounded-lg border border-border bg-card px-4 py-5 text-center text-xs font-semibold text-muted-foreground"
              >
                {c}
              </div>
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
