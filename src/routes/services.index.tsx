import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroServices from "@/assets/hero-services.jpg.asset.json";
import { Reveal } from "@/components/site/Reveal";
import { Icon } from "@/components/site/Icon";
import { ServiceRowSkeleton } from "@/components/site/Skeletons";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useServicesList } from "@/hooks/useServiceContent";


export const Route = createFileRoute("/services/")({
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
      { property: "og:url", content: "/services" },
      { property: "og:image", content: heroServices.url },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { property: "og:image:alt", content: "Illuminated sports complex at dusk" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sports Construction Services — Egytic" },
      { name: "twitter:description", content: "Turnkey design-build for elite sports facilities." },
      { name: "twitter:image", content: heroServices.url },
    ],
    links: [
      { rel: "canonical", href: "/services" },
      { rel: "alternate", hrefLang: "en", href: "/services" },
      { rel: "alternate", hrefLang: "ar", href: "/services" },
      { rel: "alternate", hrefLang: "x-default", href: "/services" },
      { rel: "preload", as: "image", href: heroServices.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Sports Construction Services — Egytic Sports",
          itemListElement: [
            "Football Pitches",
            "Athletics Tracks",
            "Indoor Arenas",
            "Tennis & Padel Courts",
            "Aquatic Centres",
            "Stadium Maintenance",
          ].map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "Service", name: n, provider: { "@type": "Organization", name: "Egytic Sports" } },
          })),
        }),
      },
    ],
  }),
});


function ServicesPage() {
  const { t, lang } = useLang();
  const { data, loading } = useServicesList();
  const ar = lang === "ar";

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.services} title={t.sections.servicesTitle} subtitle={t.sections.servicesSub} bgImage={heroServices.url} />
      <section className="py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-20">
              {Array.from({ length: 3 }).map((_, i) => (
                <ServiceRowSkeleton key={i} reverse={i % 2 === 1} />
              ))}
            </div>
          ) : data.length === 0 ? (

            <p className="text-center text-muted-foreground">{ar ? "لا توجد خدمات منشورة بعد." : "No services published yet."}</p>
          ) : data.map((s, i) => {
            const title = (ar ? s.title_ar : s.title_en) || s.title_en;
            const desc = (ar ? s.description_ar : s.description_en) || s.description_en || "";
            const alt = (ar ? s.alt_ar : s.alt_en) || title;
            return (
              <Reveal key={s.id} id={s.slug_en}>
                <div className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}>
                  <div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                      <Icon name={s.icon || "Goal"} className="h-7 w-7" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-foreground">{title}</h2>
                    {desc && <p className="mt-4 text-muted-foreground">{desc}</p>}
                    <Button asChild variant="hero" className="mt-8">
                      <Link to="/services/$slug" params={{ slug: s.slug_en }}>
                        {ar ? "تفاصيل الخدمة" : "View service"}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative overflow-hidden rounded-3xl shadow-elegant">
                    {s.cover_image ? (
                      <img
                        src={s.cover_image}
                        alt={alt}
                        aria-label={s.alt_ar && s.alt_en ? `${s.alt_en} — ${s.alt_ar}` : undefined}
                        width={1200}
                        height={900}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full bg-gradient-to-br from-secondary via-secondary/60 to-primary/20" aria-hidden />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-primary shadow-soft backdrop-blur">
                      <Icon name={s.icon || "Goal"} className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
