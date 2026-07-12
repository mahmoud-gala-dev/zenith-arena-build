import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Download, MessageCircle, Expand } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { DetailPageSkeleton } from "@/components/site/Skeletons";

import { Icon } from "@/components/site/Icon";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { ImageLightbox } from "@/components/site/ImageLightbox";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { serviceBySlugQueryOptions, useServiceBySlug } from "@/hooks/useServiceContent";

const SITE_URL = "https://zenith-arena-build.lovable.app";

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const service = await queryClient.ensureQueryData(serviceBySlugQueryOptions(params.slug));
    return { slug: params.slug, service };
  },
  head: ({ params, loaderData }) => {
    const s = loaderData?.service;
    const canonical = `${SITE_URL}/services/${params.slug}`;
    if (!s) {
      return {
        meta: [
          { title: "Service — Egytic Sports" },
          { name: "description", content: "Turnkey sports construction services by Egytic Sports." },
          { name: "robots", content: "noindex" },
          { property: "og:url", content: canonical },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const titleEn = s.seo_title_en || `${s.title_en} — Egytic Sports`;
    const titleAr = s.seo_title_ar || `${s.title_ar ?? s.title_en} — إيجيتك سبورتس`;
    const descEn = s.seo_description_en || s.description_en || "Turnkey sports construction services by Egytic Sports.";
    const descAr = s.seo_description_ar || s.description_ar || descEn;
    const altEn = s.alt_en || s.title_en;
    const altAr = s.alt_ar || s.title_ar || s.title_en;
    const arUrl = `${canonical}?lang=ar`;

    // Deterministic per-language og:image with layered fallbacks so social previews
    // never show a broken URL: language-specific og → shared og → header → cover → site hero.
    const SITE_FALLBACK = `${SITE_URL}/og-default.jpg`;
    const enChain = [s.og_image, s.header_image, s.cover_image, SITE_FALLBACK];
    const arChain = [s.og_image_ar, s.og_image, s.header_image, s.cover_image, SITE_FALLBACK];
    const pick = (chain: (string | null | undefined)[]) => chain.find((v) => typeof v === "string" && v.trim().length > 0) as string;
    const ogEn = pick(enChain);
    const ogAr = pick(arChain);
    // Emit ONE og:image (meta dedupes by property) — the English one is primary;
    // Arabic browsers reach the AR variant through the ?lang=ar canonical which
    // renders its own head with ogAr promoted below.
    const primaryOg = ogEn;
    const primaryAlt = altEn;

    const serviceLd = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: s.title_en,
      alternateName: s.title_ar ?? undefined,
      description: descEn,
      serviceType: s.category ?? "Sports Construction",
      url: canonical,
      image: [ogEn, ogAr].filter((v, i, a) => v && a.indexOf(v) === i),
      areaServed: { "@type": "Country", name: "Egypt" },
      provider: { "@type": "Organization", name: "Egytic Sports", url: SITE_URL },
    };
    const breadcrumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name: s.title_en, item: canonical },
      ],
    };
    const faqLd = s.faqs && s.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: s.faqs.map((f) => ({
            "@type": "Question",
            name: f.q_en,
            acceptedAnswer: { "@type": "Answer", text: f.a_en },
            inLanguage: "en",
          })).concat(
            s.faqs
              .filter((f) => f.q_ar && f.a_ar)
              .map((f) => ({
                "@type": "Question",
                name: f.q_ar as string,
                acceptedAnswer: { "@type": "Answer", text: f.a_ar as string },
                inLanguage: "ar",
              })),
          ),
        }
      : null;
    return {
      meta: [
        { title: `${titleEn} | ${titleAr}` },
        { name: "description", content: `${descEn} — ${descAr}` },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Egytic Sports" },
        { property: "og:url", content: canonical },
        { property: "og:title", content: titleEn },
        { property: "og:description", content: descEn },
        { property: "og:locale", content: "en_US" },
        { property: "og:locale:alternate", content: "ar_EG" },
        { property: "og:image", content: primaryOg },
        { property: "og:image:alt", content: primaryAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titleEn },
        { name: "twitter:description", content: descEn },
        { name: "twitter:image", content: primaryOg },
        { name: "twitter:image:alt", content: primaryAlt },
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hreflang: "en", href: canonical },
        { rel: "alternate", hreflang: "ar", href: arUrl },
        { rel: "alternate", hreflang: "x-default", href: canonical },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(serviceLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbsLd) },
        ...(faqLd ? [{ type: "application/ld+json", children: JSON.stringify(faqLd) }] : []),
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const copy = ar
    ? { back: "العودة للخدمات", overview: "نظرة عامة", gallery: "معرض الخدمة", brochure: "تحميل البروشور", whatsapp: "واتساب", quote: "اطلب عرض سعر", notFound: "لم يتم العثور على الخدمة", faq: "الأسئلة الشائعة" }
    : { back: "Back to services", overview: "Overview", gallery: "Service gallery", brochure: "Download brochure", whatsapp: "WhatsApp", quote: "Request quote", notFound: "Service not found", faq: "Frequently asked questions" };

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
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {/* Background layers */}
        <div className="absolute inset-0 z-0">
          {service.header_image ? (
            <img
              src={service.header_image}
              alt={currentAlt}
              aria-label={`${alt_en} — ${alt_ar}`}
              width={1920}
              height={900}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70 motion-safe:animate-[fade-in_1.2s_ease-out]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/85 to-primary/40" aria-hidden />
          )}
          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" aria-hidden />
          <div
            className="absolute inset-0 opacity-20 mix-blend-soft-light"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20L0 20z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E\")" }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.18),transparent_55%)]" aria-hidden />
          {/* Corner glow */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/10 blur-[100px]" aria-hidden />
        </div>

        {/* Top navigation row */}
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-28 sm:px-6 sm:pt-32 md:flex-row md:items-center md:justify-between lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.services, to: "/services" }, { label: title }]} />
          <Link
            to="/services"
            className="group/back inline-flex items-center gap-3 text-white/60 transition hover:text-white"
          >
            <span className="rounded-full border border-white/10 p-2 transition group-hover/back:border-gold group-hover/back:bg-gold/10">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover/back:-translate-x-1 rtl:group-hover/back:translate-x-1" />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.2em]">{copy.back}</span>
          </Link>
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          {service.category && (
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold">{service.category}</span>
            </div>
          )}

          <div className="relative">
            {/* Left gold accent stripe */}
            <span className="absolute -left-6 top-0 bottom-0 hidden w-1 bg-gradient-to-b from-gold to-transparent md:block rtl:-right-6 rtl:left-auto rtl:bg-gradient-to-b" aria-hidden />
            <h1 className="text-5xl font-bold leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
          </div>

          <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr),auto] md:items-end">
            <div className="max-w-2xl">
              {desc && (
                <p className="mb-8 text-lg font-light leading-relaxed text-white/60 sm:text-xl">{desc}</p>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild variant="gold" size="lg" className="shadow-[0_10px_40px_-10px_rgba(212,175,55,0.55)] hover:shadow-[0_14px_50px_-8px_rgba(212,175,55,0.7)]">
                  <Link to="/quote">{copy.quote} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
                </Button>
                <Button asChild variant="outlineLight" size="lg" className="backdrop-blur-sm">
                  <a href="https://wa.me/971500000000"><MessageCircle className="h-4 w-4" /> {copy.whatsapp}</a>
                </Button>
                {gallery.length > 0 && (
                  <span className="text-sm text-white/50">
                    {gallery.length} {ar ? "صورة" : "images"}
                  </span>
                )}
              </div>
            </div>

            <div className="hidden text-right md:block rtl:text-left">
              <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-[0_20px_45px_-15px_rgba(212,175,55,0.55)] ring-1 ring-gold/40 ltr:ml-auto rtl:mr-auto">
                <Icon name={service.icon || "Goal"} className="h-8 w-8" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/70">Egytic Sports</p>
            </div>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="relative z-10 flex h-1.5 w-full">
          <div className="h-full w-1/3 bg-gold" />
          <div className="h-full w-2/3 bg-white/5" />
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
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground">{copy.gallery}</h2>
              <span className="text-sm text-muted-foreground tabular-nums">{gallery.length} {ar ? "صورة" : "images"}</span>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={`${ar ? "افتح الصورة" : "Open image"} ${i + 1}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={url}
                    alt={`${currentAlt} — ${i + 1}`}
                    aria-label={`${alt_en} — ${alt_ar} — ${i + 1}`}
                    width={1200}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-3 right-3 rtl:right-auto rtl:left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <Expand className="h-3.5 w-3.5" />
                    {ar ? "تكبير" : "Expand"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <ImageLightbox
            images={gallery}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={(dir) => setLightboxIndex((i) => i === null ? null : (i + dir + gallery.length) % gallery.length)}
            alt={currentAlt}
          />
        </section>
      )}

      {service.faqs && service.faqs.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">{copy.faq}</h2>
            <dl className="mt-8 space-y-4">
              {service.faqs.map((f, i) => {
                const q = (ar && f.q_ar) ? f.q_ar : f.q_en;
                const a = (ar && f.a_ar) ? f.a_ar : f.a_en;
                return (
                  <details key={i} className="group rounded-xl border border-border bg-card p-5 shadow-soft open:shadow-elegant">
                    <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        <span>{q}</span>
                        <span className="text-primary transition-transform group-open:rotate-45" aria-hidden>+</span>
                      </span>
                    </summary>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{a}</p>
                  </details>
                );
              })}
            </dl>
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
