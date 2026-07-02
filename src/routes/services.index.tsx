import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { services, servicesHero } from "@/lib/site-data";

export const Route = createFileRoute("/services/")({
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLang();
  const L = useLocalized();

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.services} title={t.sections.servicesTitle} subtitle={t.sections.servicesSub} bgImage={servicesHero} />
      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {services.map((s, i) => (
            <Reveal key={s.id} id={s.id}>
              <div className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}>
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                    <Icon name={s.icon} className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold text-foreground">{L(s.title)}</h2>
                  <p className="mt-4 text-muted-foreground">{L(s.description)}</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {s.features.map((f, k) => (
                      <li key={k} className="flex items-center gap-2 text-sm text-foreground/85">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {L(f)}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="hero" className="mt-8">
                    <Link to="/contact">
                      {t.cta.getConsultation}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                </div>
                <div className="relative overflow-hidden rounded-3xl shadow-elegant">
                  <img
                    src={s.image}
                    alt={L(s.title)}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                  <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-primary shadow-soft backdrop-blur">
                    <Icon name={s.icon} className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}