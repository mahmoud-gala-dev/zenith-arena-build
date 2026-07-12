import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { aboutContentQueryOptions, aboutPageSettingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/about")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(aboutContentQueryOptions),
    context.queryClient.ensureQueryData(aboutPageSettingsQueryOptions),
  ]),
  component: AboutPage,
  errorComponent: ({ error }) => <div role="alert" className="p-8">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function AboutPage() {
  const { t, lang } = useLang();
  const { data } = useSuspenseQuery(aboutContentQueryOptions);
  const { data: pageSettings } = useSuspenseQuery(aboutPageSettingsQueryOptions);
  const isAr = lang === "ar";

  const heroImg = data.hero.image_url || pageSettings.hero_image_url;
  const aboutImg = pageSettings.about_image_url || heroImg;
  const heroStats = data.stats.length ? data.stats : pageSettings.stats;
  const heroEyebrow = isAr ? data.hero.eyebrow_ar : data.hero.eyebrow_en;
  const heroTitle = isAr ? data.hero.title_ar : data.hero.title_en;
  const heroSubtitle = isAr ? data.hero.subtitle_ar : data.hero.subtitle_en;
  const storyBody = isAr ? data.story.body_ar : data.story.body_en;
  const storyTitle = isAr ? data.story.title_ar : data.story.title_en;

  return (
    <SiteLayout>
      <PageHero eyebrow={heroEyebrow || t.nav.about} title={heroTitle || t.brandFull} subtitle={heroSubtitle || t.footer.tagline} image={heroImg} />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal className="relative overflow-hidden rounded-3xl shadow-elegant">
            <img src={aboutImg} alt={heroTitle || "About"} className="h-full w-full object-cover" />
          </Reveal>
          <Reveal delay={80}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{storyTitle || t.sections.whySub}</span>
            <h2 className="mt-4 text-3xl font-bold text-foreground">{storyTitle || t.sections.whySub}</h2>
            <p className="mt-4 text-muted-foreground">{storyBody || t.hero.subtitle}</p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              {heroStats.map((s) => (
                <div key={s.key}>
                  <p className="text-3xl font-bold text-gradient">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{isAr ? s.label_ar : s.label_en}</p>
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
            {data.values.map((v, i) => {
              const IconCmp = (Icons as unknown as Record<string, typeof ShieldCheck>)[v.icon] ?? ShieldCheck;
              return (
                <Reveal key={i} delay={i * 70}>
                  <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-soft">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                      <IconCmp className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-foreground">{isAr ? v.title_ar : v.title_en}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{isAr ? v.desc_ar : v.desc_en}</p>
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
