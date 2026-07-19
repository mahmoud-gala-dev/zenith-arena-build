import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Quote } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { clientsPublishedQueryOptions, testimonialsPublishedQueryOptions, seoSettingsByRouteQueryOptions } from "@/lib/queries";
import { buildSeoHead } from "@/lib/seo-head";

export const Route = createFileRoute("/clients")({
  loader: async ({ context }) => {
    const [, , seo] = await Promise.all([
      context.queryClient.ensureQueryData(clientsPublishedQueryOptions),
      context.queryClient.ensureQueryData(testimonialsPublishedQueryOptions),
      context.queryClient.ensureQueryData(seoSettingsByRouteQueryOptions("/clients")),
    ]);
    return { seo };
  },
  head: ({ loaderData }) =>
    buildSeoHead({
      routePath: "/clients",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Our Clients — Egytic Sports",
      fallbackTitleAr: "عملاؤنا — إيجيتك سبورتس",
      fallbackDescEn: "Federations, ministries, universities and clubs trust Egytic.",
      fallbackDescAr: "اتحادات ووزارات وجامعات وأندية تثق بإيجيتك.",
    }),

  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: ClientsPage,
});

function ClientsPage() {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const { data: clients } = useSuspenseQuery(clientsPublishedQueryOptions);
  const { data: testimonials } = useSuspenseQuery(testimonialsPublishedQueryOptions);

  const tx = T.pages.clients;

  const groups = useMemo(() => {
    const map = new Map<string, typeof clients>();
    for (const c of clients) {
      const key = c.industry?.trim() || tx.other;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [clients, tx.other]);

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section aria-labelledby="clients-groups-heading" className="py-12 sm:py-16">
        <h2 id="clients-groups-heading" className="sr-only">{T.pages.clients.groupsHeading}</h2>
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:space-y-14 sm:px-6 lg:px-8">
          {clients.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{tx.emptyClients}</p>
          ) : (
            groups.map(([label, items]) => (
              <Reveal key={label}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">{label}</h3>
                  <span className="text-xs font-medium text-muted-foreground">{items.length}</span>
                </div>
                <ul role="list" className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {items.map((c) => {
                    const name = ar ? c.name_ar : c.name_en;
                    const inner = c.logo_url ? (
                      <img src={c.logo_url} alt={name} loading="lazy" className="max-h-14 max-w-[80%] object-contain" />
                    ) : (
                      <span className="line-clamp-3">{name}</span>
                    );
                    return (
                      <li key={c.id}>
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noreferrer" className="flex aspect-[3/2] min-h-11 items-center justify-center rounded-xl border border-border bg-card p-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-elegant sm:p-4 sm:text-xs" title={name}>
                            {inner}
                          </a>
                        ) : (
                          <div className="flex aspect-[3/2] min-h-11 items-center justify-center rounded-xl border border-border bg-card p-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-elegant sm:p-4 sm:text-xs" title={name}>
                            {inner}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="testimonials-heading" className="border-t border-border bg-secondary/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="testimonials-heading" className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">{tx.testimonialsTitle}</h2>
          {testimonials.length === 0 ? (
            <p className="mt-8 text-muted-foreground">{tx.emptyTestimonials}</p>
          ) : (
            <div className="mt-8 grid gap-5 sm:mt-10 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Reveal key={t.id}>
                  <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant sm:p-7">
                    <Quote className="h-8 w-8 shrink-0 text-primary/40" aria-hidden="true" />
                    <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/85 sm:text-base">
                      <p>{ar ? t.quote_ar : t.quote_en}</p>
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                      {t.avatar_url && (
                        <img src={t.avatar_url} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{ar ? t.name_ar : t.name_en}</p>
                        {(ar ? t.role_ar || t.company_ar : t.role_en || t.company_en) && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {[ar ? t.role_ar : t.role_en, ar ? t.company_ar : t.company_en].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="clients-cta-heading" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant sm:gap-6 sm:p-12 md:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-texture opacity-20" />
          <h3 id="clients-cta-heading" className="relative text-xl font-bold sm:text-2xl md:text-3xl">{tx.cta}</h3>
          <Button asChild variant="gold" size="lg" className="relative min-h-11">
            <Link to="/contact" aria-label={tx.ctaBtn}>{tx.ctaBtn}<ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
