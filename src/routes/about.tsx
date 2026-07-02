import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Cpu, Wrench, Award, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { aboutImg, heroStats } from "@/lib/site-data";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const values = [ShieldCheck, Cpu, Wrench, Award];

function AboutPage() {
  const { t } = useLang();
  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.about} title={t.brandFull} subtitle={t.footer.tagline} />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl shadow-elegant">
            <img src={aboutImg} alt="Facility" className="h-full w-full object-cover" />
          </Reveal>
          <Reveal delay={80}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t.sections.whyTitle}</span>
            <h2 className="mt-4 text-3xl font-bold text-foreground">{t.sections.whySub}</h2>
            <p className="mt-4 text-muted-foreground">{t.hero.subtitle}</p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              {heroStats.map((s) => (
                <div key={s.key}>
                  <p className="text-3xl font-bold text-gradient">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.hero[s.key]}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="hero" className="mt-8">
              <Link to="/contact">
                {t.cta.getConsultation}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="bg-secondary/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {([
              [t.why.i1t, t.why.i1d],
              [t.why.i2t, t.why.i2d],
              [t.why.i3t, t.why.i3d],
              [t.why.i4t, t.why.i4d],
            ] as const).map(([title, desc], i) => {
              const IconCmp = values[i];
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-soft">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                      <IconCmp className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
