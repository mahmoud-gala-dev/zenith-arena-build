import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Download, MessageCircle, Expand, CheckCircle2, ShieldCheck, Award, Clock, Wrench, Users, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { DetailPageSkeleton } from "@/components/site/Skeletons";

import { Icon } from "@/components/site/Icon";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { ImageLightbox } from "@/components/site/ImageLightbox";
import { ServiceQuoteForm } from "@/components/site/ServiceQuoteForm";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { serviceBySlugQueryOptions, servicesPublishedQueryOptions, useServiceBySlug } from "@/hooks/useServiceContent";
import { projectsPublishedListQueryOptions, dbProjectToView } from "@/lib/queries";

const SITE_URL = "https://zenith-arena-build.lovable.app";


type ServiceSearch = { lang?: "en" | "ar" };

export const Route = createFileRoute("/services/$slug")({
  validateSearch: (search: Record<string, unknown>): ServiceSearch => {
    const raw = typeof search.lang === "string" ? search.lang.toLowerCase() : undefined;
    return { lang: raw === "ar" ? "ar" : raw === "en" ? "en" : undefined };
  },
  loaderDeps: ({ search }) => ({ lang: search.lang ?? "en" }),
  loader: async ({ params, context: { queryClient } }) => {
    const [service] = await Promise.all([
      queryClient.ensureQueryData(serviceBySlugQueryOptions(params.slug)),
      queryClient.ensureQueryData(servicesPublishedQueryOptions),
      queryClient.ensureQueryData(projectsPublishedListQueryOptions),
    ]);
    return { slug: params.slug, service };
  },

  head: ({ params, loaderData, match }) => {
    const s = loaderData?.service;
    const search = (match?.search ?? {}) as ServiceSearch;
    const activeLang: "en" | "ar" = search.lang === "ar" ? "ar" : "en";
    const isAr = activeLang === "ar";
    const enUrl = `${SITE_URL}/services/${params.slug}`;
    const arUrl = `${enUrl}?lang=ar`;
    const canonical = isAr ? arUrl : enUrl;

    if (!s) {
      return {
        meta: [
          { title: isAr ? "خدمة — إيجيتك سبورتس" : "Service — Egytic Sports" },
          { name: "description", content: isAr ? "خدمات إنشاءات رياضية متكاملة من إيجيتك سبورتس." : "Turnkey sports construction services by Egytic Sports." },
          { name: "robots", content: "noindex" },
          { property: "og:url", content: canonical },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }

    const titleEn = s.seo_title_en || `${s.title_en} — Egytic Sports`;
    const titleAr = s.seo_title_ar || `${s.title_ar ?? s.title_en} — إيجيتك سبورتس`;
    const descEn = s.seo_description_en || s.description_en || "Turnkey sports construction services by Egytic Sports.";
    const descAr = s.seo_description_ar || s.description_ar || "خدمات إنشاءات رياضية متكاملة من إيجيتك سبورتس.";
    const altEn = s.alt_en || s.title_en;
    const altAr = s.alt_ar || s.title_ar || s.title_en;

    const activeTitle = isAr ? titleAr : titleEn;
    const activeDesc = isAr ? descAr : descEn;
    const activeAlt = isAr ? altAr : altEn;

    // Layered image fallbacks so social previews never break.
    const SITE_FALLBACK = `${SITE_URL}/og-default.jpg`;
    const enChain = [s.og_image, s.header_image, s.cover_image, SITE_FALLBACK];
    const arChain = [s.og_image_ar, s.og_image, s.header_image, s.cover_image, SITE_FALLBACK];
    const pick = (chain: (string | null | undefined)[]) =>
      chain.find((v) => typeof v === "string" && v.trim().length > 0) as string;
    const ogEn = pick(enChain);
    const ogAr = pick(arChain);
    const activeOg = isAr ? ogAr : ogEn;

    const serviceLd = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: isAr ? (s.title_ar ?? s.title_en) : s.title_en,
      alternateName: isAr ? s.title_en : (s.title_ar ?? undefined),
      description: activeDesc,
      inLanguage: isAr ? "ar" : "en",
      serviceType: s.category ?? "Sports Construction",
      url: canonical,
      image: [ogEn, ogAr].filter((v, i, a) => v && a.indexOf(v) === i),
      areaServed: { "@type": "Country", name: isAr ? "مصر" : "Egypt" },
      provider: { "@type": "Organization", name: "Egytic Sports", url: SITE_URL },
    };
    const breadcrumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isAr ? "الرئيسية" : "Home", item: `${SITE_URL}/${isAr ? "?lang=ar" : ""}` },
        { "@type": "ListItem", position: 2, name: isAr ? "الخدمات" : "Services", item: `${SITE_URL}/services${isAr ? "?lang=ar" : ""}` },
        { "@type": "ListItem", position: 3, name: isAr ? (s.title_ar ?? s.title_en) : s.title_en, item: canonical },
      ],
    };
    const faqLd = s.faqs && s.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: isAr ? "ar" : "en",
          mainEntity: (isAr
            ? s.faqs.filter((f) => f.q_ar && f.a_ar).map((f) => ({
                "@type": "Question",
                name: f.q_ar as string,
                acceptedAnswer: { "@type": "Answer", text: f.a_ar as string },
              }))
            : s.faqs.map((f) => ({
                "@type": "Question",
                name: f.q_en,
                acceptedAnswer: { "@type": "Answer", text: f.a_en },
              }))),
        }
      : null;

    return {
      meta: [
        { title: activeTitle },
        { name: "description", content: activeDesc },
        { name: "language", content: isAr ? "ar" : "en" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Egytic Sports" },
        { property: "og:url", content: canonical },
        { property: "og:title", content: activeTitle },
        { property: "og:description", content: activeDesc },
        { property: "og:locale", content: isAr ? "ar_EG" : "en_US" },
        { property: "og:locale:alternate", content: isAr ? "en_US" : "ar_EG" },
        { property: "og:image", content: activeOg },
        { property: "og:image:alt", content: activeAlt },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: activeTitle },
        { name: "twitter:description", content: activeDesc },
        { name: "twitter:image", content: activeOg },
        { name: "twitter:image:alt", content: activeAlt },
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hreflang: "en", href: enUrl },
        { rel: "alternate", hreflang: "ar", href: arUrl },
        { rel: "alternate", hreflang: "x-default", href: enUrl },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(serviceLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbsLd) },
        ...(faqLd && (faqLd.mainEntity as unknown[]).length ? [{ type: "application/ld+json", children: JSON.stringify(faqLd) }] : []),
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

  const { data: allServices } = useQuery(servicesPublishedQueryOptions);
  const { data: allProjectsDb } = useQuery(projectsPublishedListQueryOptions);

  const relatedServices = useMemo(() => {
    const list = allServices ?? [];
    if (!service) return [];
    return list
      .filter((s) => s.slug_en !== service.slug_en && (service.category ? s.category === service.category : true))
      .slice(0, 3);
  }, [allServices, service]);

  const relatedProjects = useMemo(() => {
    const list = (allProjectsDb ?? []).map(dbProjectToView);
    if (!service) return list.slice(0, 3);
    const cat = (service.category ?? "").toLowerCase();
    const matches = cat
      ? list.filter((p) => p.category.toLowerCase().includes(cat) || cat.includes(p.category.toLowerCase()))
      : [];
    return (matches.length ? matches : list).slice(0, 3);
  }, [allProjectsDb, service]);

  const benefits = ar
    ? [
        { icon: ShieldCheck, title: "جودة معتمدة دوليًا", desc: "منتجات وأنظمة مطابقة لمعايير FIFA و World Athletics و ITF." },
        { icon: Award, title: "خبرة +15 سنة", desc: "أكثر من 200 مشروع منفَّذ في مصر والشرق الأوسط وأفريقيا." },
        { icon: Clock, title: "تسليم في الموعد", desc: "جدول زمني ملزم مع تحديثات أسبوعية وضمانات تأخير." },
        { icon: Wrench, title: "حل تسليم مفتاح", desc: "دراسة، تصميم، توريد، تنفيذ، وصيانة من مصدر واحد." },
        { icon: Users, title: "فريق هندسي مقيم", desc: "مهندس مشروع مخصص + إشراف ميداني يومي." },
        { icon: Sparkles, title: "ضمان يمتد حتى 8 سنوات", desc: "على الأسطح الرياضية مع خطة صيانة وقائية." },
      ]
    : [
        { icon: ShieldCheck, title: "Internationally certified quality", desc: "Products & systems compliant with FIFA, World Athletics and ITF." },
        { icon: Award, title: "15+ years of expertise", desc: "200+ delivered projects across Egypt, the Middle East and Africa." },
        { icon: Clock, title: "On-time delivery", desc: "Binding schedule with weekly updates and delay guarantees." },
        { icon: Wrench, title: "Turnkey solution", desc: "Study, design, supply, installation and maintenance in-house." },
        { icon: Users, title: "Dedicated engineering team", desc: "Assigned project engineer + daily on-site supervision." },
        { icon: Sparkles, title: "Warranty up to 8 years", desc: "On sports surfaces with a preventive maintenance plan." },
      ];

  const copy = ar
    ? { back: "العودة للخدمات", overview: "نظرة عامة", gallery: "معرض الخدمة", brochure: "تحميل البروشور", whatsapp: "واتساب", quote: "اطلب عرض سعر", notFound: "لم يتم العثور على الخدمة", faq: "الأسئلة الشائعة", benefits: "لماذا تختار هذه الخدمة", benefitsSub: "مزايا نقدمها في كل مشروع من البداية للتسليم.", related: "خدمات ذات صلة", relatedSub: "استكشف خدمات تكميلية تعزّز مشروعك.", projects: "أمثلة من مشاريعنا", projectsSub: "لقطات حقيقية من تنفيذنا لهذه الخدمة.", viewAll: "عرض كل المشاريع", viewService: "استعرض الخدمة", viewProject: "تفاصيل المشروع" }
    : { back: "Back to services", overview: "Overview", gallery: "Service gallery", brochure: "Download brochure", whatsapp: "WhatsApp", quote: "Request quote", notFound: "Service not found", faq: "Frequently asked questions", benefits: "Why choose this service", benefitsSub: "What we bring to every project, from kick-off to hand-over.", related: "Related services", relatedSub: "Complementary services that strengthen your project.", projects: "Selected past projects", projectsSub: "Real deliveries from our field team for this service.", viewAll: "View all projects", viewService: "View service", viewProject: "Project details" };


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

      {/* Benefits */}
      <section className="border-b border-border bg-gradient-to-b from-background to-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">01</span>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{copy.benefits}</h2>
            <p className="mt-3 text-muted-foreground">{copy.benefitsSub}</p>
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => {
              const IconEl = b.icon;
              return (
                <li key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-elegant">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground ring-1 ring-gold/30 transition group-hover:scale-110">
                    <IconEl className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
                  <CheckCircle2 className="absolute -bottom-2 -right-2 h-16 w-16 text-gold/5 transition group-hover:text-gold/10 rtl:-left-2 rtl:right-auto" aria-hidden />
                </li>
              );
            })}
          </ul>
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

      {/* Related projects */}
      {relatedProjects.length > 0 && (
        <section className="border-y border-border bg-secondary/40 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">02</span>
                <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{copy.projects}</h2>
                <p className="mt-3 text-muted-foreground">{copy.projectsSub}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/projects">{copy.viewAll}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((p) => (
                <Link
                  key={p.slug}

                  to="/projects/$slug"
                  params={{ slug: p.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={ar ? p.title.ar : p.title.en}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-ink/80 to-primary/40" aria-hidden />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-gold backdrop-blur rtl:left-auto rtl:right-3">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
                      {ar ? p.title.ar : p.title.en}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {[ar ? p.location.ar : p.location.en, p.year].filter(Boolean).join(" · ")}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      {copy.viewProject}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related services */}
      {relatedServices.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">03</span>
              <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{copy.related}</h2>
              <p className="mt-3 text-muted-foreground">{copy.relatedSub}</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((rs) => {
                const rsTitle = (ar ? rs.title_ar : rs.title_en) || rs.title_en;
                const rsDesc = (ar ? rs.description_ar : rs.description_en) || rs.description_en || "";
                return (
                  <Link
                    key={rs.id}
                    to="/services/$slug"
                    params={{ slug: rs.slug_en }}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-elegant"
                  >
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold text-gold-foreground ring-1 ring-gold/30 transition group-hover:scale-110">
                      <Icon name={rs.icon || "Goal"} className="h-6 w-6" />
                    </div>
                    {rs.category && (
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gold/80">{rs.category}</span>
                    )}
                    <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-primary">{rsTitle}</h3>
                    {rsDesc && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{rsDesc}</p>}
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      {copy.viewService}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ServiceQuoteForm serviceSlug={slug} serviceTitle={title} />




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
