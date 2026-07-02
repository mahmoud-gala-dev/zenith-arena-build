import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Download, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { DetailPageSkeleton } from "@/components/site/Skeletons";

import { Icon } from "@/components/site/Icon";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { useServiceBySlug } from "@/hooks/useServiceContent";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => ({ slug: params.slug }),
  head: ({ params }) => {
    const title = `Service — Egytic Sports`;
    return {
      meta: [
        { title },
        { name: "description", content: "Turnkey sports construction services by Egytic Sports." },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/services/${params.slug}` },
      ],
      links: [
        { rel: "canonical", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "en", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "ar", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: `/services/${params.slug}` },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { slug } = Route.useLoaderData();
  const { lang, t } = useLang();
  const { data: service, loading } = useServiceBySlug(slug);
  const ar = lang === "ar";

  const copy = ar
    ? { back: "العودة للخدمات", overview: "نظرة عامة", gallery: "معرض الخدمة", brochure: "تحميل البروشور", whatsapp: "واتساب", quote: "اطلب عرض سعر", notFound: "لم يتم العثور على الخدمة" }
    : { back: "Back to services", overview: "Overview", gallery: "Service gallery", brochure: "Download brochure", whatsapp: "WhatsApp", quote: "Request quote", notFound: "Service not found" };

  if (loading) {
    return <SiteLayout><DetailPageSkeleton /></SiteLayout>;
  }

  if (!service) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold">{copy.notFound}</h1>
          <Button asChild className="mt-6"><Link to="/services">{copy.back}</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const title = (ar ? service.title_ar : service.title_en) || service.title_en;
  const desc = (ar ? service.description_ar : service.description_en) || service.description_en || "";
  const alt_en = service.alt_en || service.title_en;
  const alt_ar = service.alt_ar || service.title_ar || service.title_en;
  const currentAlt = ar ? alt_ar : alt_en;
  const gallery = service.gallery_images;

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-ink pt-32 pb-16 text-white">
        {service.header_image ? (
          <img
            src={service.header_image}
            alt={currentAlt}
            aria-label={`${alt_en} — ${alt_ar}`}
            width={1920}
            height={820}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/80 to-primary/40" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.services, to: "/services" }, { label: title }]} />
          <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {copy.back}
          </Link>
          <div className="mt-8 flex max-w-4xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground">
                <Icon name={service.icon || "Goal"} className="h-7 w-7" />
              </div>
              <h1 className="mt-6 text-4xl font-bold sm:text-5xl">{title}</h1>
              {desc && <p className="mt-4 max-w-3xl text-lg text-white/72">{desc}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="gold"><Link to="/quote">{copy.quote}</Link></Button>
              <Button asChild variant="outlineLight"><a href="https://wa.me/971500000000"><MessageCircle className="h-4 w-4" /> {copy.whatsapp}</a></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="text-2xl font-bold text-foreground">{copy.overview}</h2>
              {desc && <p className="mt-4 leading-relaxed text-muted-foreground">{desc}</p>}
            </section>

            {service.cover_image && (
              <figure className="overflow-hidden rounded-2xl border border-border shadow-soft">
                <img
                  src={service.cover_image}
                  alt={currentAlt}
                  aria-label={`${alt_en} — ${alt_ar}`}
                  width={1200}
                  height={750}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="aspect-[16/10] w-full object-cover"
                />
                <figcaption className="sr-only">{alt_en} — {alt_ar}</figcaption>
              </figure>
            )}

            <div className="border-t border-border pt-6">
              <ShareButtons title={title} path={`/services/${slug}`} />
            </div>
          </div>
          <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground">{copy.brochure}</h2>
            <p className="text-sm text-muted-foreground">{ar ? "احصل على المواصفات والمتطلبات الأساسية لهذه الخدمة." : "Get the core specifications and requirements for this service."}</p>
            <Button className="w-full" variant="hero"><Download className="h-4 w-4" /> {copy.brochure}</Button>
            <Button asChild className="w-full" variant="outline"><Link to="/quote">{copy.quote}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>
          </aside>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">{copy.gallery}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((url, i) => (
                <figure key={`${url}-${i}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
                  <img
                    src={url}
                    alt={`${currentAlt} — ${i + 1}`}
                    aria-label={`${alt_en} — ${alt_ar} — ${i + 1}`}
                    width={1200}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-hero py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">{t.sections.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{t.sections.ctaSub}</p>
          <Button asChild variant="gold" size="lg" className="mt-7"><Link to="/quote">{copy.quote}</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
