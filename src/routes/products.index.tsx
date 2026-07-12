import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, Download } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroImg from "@/assets/hero-products.jpg";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { productsPublishedQueryOptions, productCategoriesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/products/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsPublishedQueryOptions),
      context.queryClient.ensureQueryData(productCategoriesQueryOptions),
    ]),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: ProductsPage,
});

function ProductsPage() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const { data: products } = useSuspenseQuery(productsPublishedQueryOptions);
  const { data: categories } = useSuspenseQuery(productCategoriesQueryOptions);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.products} title={t.sections.productsTitle} subtitle={t.sections.productsSub} bgImage={heroImg} />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{ar ? "لا توجد منتجات بعد." : "No products yet."}</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((p, i) => {
                const title = ar ? p.title_ar : p.title_en;
                const desc = ar ? p.description_ar : p.description_en;
                const cat = p.category_id ? catMap.get(p.category_id) : undefined;
                const catLabel = cat ? (ar ? cat.title_ar : cat.title_en) : "";
                const cert = p.certifications?.[0] ?? "";
                return (
                  <Reveal key={p.id} delay={i * 60}>
                    <div className="group flex h-full min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-secondary">
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt={title}
                            width={640}
                            height={400}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {cert && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink rtl:left-3 rtl:right-auto">
                            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                            {cert}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        {catLabel && <span className="text-xs font-semibold uppercase tracking-wider text-primary">{catLabel}</span>}
                        <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-7 text-foreground">{title}</h3>
                        <p className="mt-2 line-clamp-3 min-h-[3.75rem] flex-1 text-sm leading-5 text-muted-foreground">{desc}</p>
                        <Button asChild variant="outline" size="sm" className="mt-5 w-full shrink-0">
                          <Link to="/products/$slug" params={{ slug: p.slug_en }}>{t.cta.learnMore}</Link>
                        </Button>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}

          <Reveal className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-hero px-8 py-12 text-center sm:flex-row sm:text-start">
            <div>
              <h3 className="text-2xl font-bold text-white">{t.cta.downloadCatalog}</h3>
              <p className="mt-2 text-white/70">{t.sections.productsSub}</p>
            </div>
            <Button asChild variant="gold" size="lg" className="shrink-0">
              <Link to="/downloads">
                <Download className="h-5 w-5" />
                {t.cta.downloadCatalog}
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
