import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Download } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { products } from "@/lib/site-data";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  const { t } = useLang();
  const L = useLocalized();

  return (
    <SiteLayout>
      <PageHero eyebrow={t.nav.products} title={t.sections.productsTitle} subtitle={t.sections.productsSub} />
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={p.image} alt={L(p.title)} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink rtl:left-3 rtl:right-auto">
                      <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      {p.certified}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">{L(p.category)}</span>
                    <h3 className="mt-2 text-lg font-semibold text-foreground">{L(p.title)}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{L(p.description)}</p>
                    <Button asChild variant="outline" size="sm" className="mt-5 w-full">
                      <Link to="/products/$slug" params={{ slug: p.id }}>{t.cta.learnMore}</Link>
                    </Button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-hero px-8 py-12 text-center sm:flex-row sm:text-start">
            <div>
              <h3 className="text-2xl font-bold text-white">{t.cta.downloadCatalog}</h3>
              <p className="mt-2 text-white/70">{t.sections.productsSub}</p>
            </div>
            <Button variant="gold" size="lg" className="shrink-0">
              <Download className="h-5 w-5" />
              {t.cta.downloadCatalog}
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}