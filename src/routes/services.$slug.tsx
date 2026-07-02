import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Download, MessageCircle, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Icon } from "@/components/site/Icon";
import { ProjectCard } from "@/components/site/Cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { GallerySection } from "@/components/site/GallerySection";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects, services, products } from "@/lib/site-data";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = services.find((item) => item.id === params.slug);
    if (!service) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const service = services.find((item) => item.id === params.slug);
    if (!service) {
      return { meta: [{ title: "Service not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${service.title.en} — Sports Construction Services | Egytic`;
    const desc = service.description.en;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/services/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [
        { rel: "canonical", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "en", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "ar", href: `/services/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: `/services/${params.slug}` },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title.en,
            description: service.description.en,
            serviceType: service.title.en,
            url: `/services/${params.slug}`,
            provider: { "@type": "Organization", name: "Egytic Sports" },
            areaServed: { "@type": "Place", name: "GCC & MENA" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Services", item: "/services" },
              { "@type": "ListItem", position: 3, name: service.title.en, item: `/services/${params.slug}` },
            ],
          },
        ]),
      }],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { slug } = Route.useLoaderData();
  const { lang, t } = useLang();
  const L = useLocalized();
  const service = services.find((item) => item.id === slug)!;
  const ar = lang === "ar";

  const copy = ar
    ? {
        back: "العودة للخدمات",
        overview: "نظرة عامة",
        benefits: "الفوائد الرئيسية",
        specs: "المواصفات الفنية",
        steps: "خطوات التنفيذ",
        materials: "المواد المستخدمة",
        gallery: "معرض الخدمة",
        relatedProducts: "منتجات ذات صلة",
        relatedProjects: "مشاريع ذات صلة",
        faq: "أسئلة شائعة",
        brochure: "تحميل البروشور",
        whatsapp: "واتساب",
        quote: "اطلب عرض سعر",
        specRows: ["دراسة الموقع والتربة", "تصريف وري حسب نوع المنشأة", "مواد معتمدة للأداء والسلامة", "اختبار وتسليم موثق"],
        stepRows: ["استشارة وتحديد نطاق العمل", "تصميم ومخططات تنفيذية", "أعمال مدنية وبنية تحتية", "تركيب السطح والمعدات", "اختبارات وتسليم وصيانة"],
        materialRows: ["طبقات قاعدة هندسية", "سطح رياضي متخصص", "إضاءة وتجهيزات", "أنظمة حماية وتصريف"],
      }
    : {
        back: "Back to services",
        overview: "Overview",
        benefits: "Key benefits",
        specs: "Technical specifications",
        steps: "Construction steps",
        materials: "Materials used",
        gallery: "Service gallery",
        relatedProducts: "Related products",
        relatedProjects: "Related projects",
        faq: "FAQs",
        brochure: "Download brochure",
        whatsapp: "WhatsApp",
        quote: "Request quote",
        specRows: ["Site and soil assessment", "Drainage and irrigation matched to facility type", "Certified materials for performance and safety", "Documented testing and handover"],
        stepRows: ["Consultation and scope definition", "Design and shop drawings", "Civil works and infrastructure", "Surface and equipment installation", "Testing, handover and maintenance"],
        materialRows: ["Engineered base layers", "Specialized sports surface", "Lighting and equipment", "Protection and drainage systems"],
      };

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-ink pt-32 pb-16 text-white">
        <img src={service.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.services, to: "/services" }, { label: L(service.title) }]} />
          <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {copy.back}
          </Link>
          <div className="mt-8 flex max-w-4xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold text-gold-foreground">
                <Icon name={service.icon} className="h-7 w-7" />
              </div>
              <h1 className="mt-6 text-4xl font-bold sm:text-5xl">{L(service.title)}</h1>
              <p className="mt-4 max-w-3xl text-lg text-white/72">{L(service.description)}</p>
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
          <div className="space-y-12 lg:col-span-2">
            <Block title={copy.overview}><p className="leading-relaxed text-muted-foreground">{L(service.description)}</p></Block>
            <Block title={copy.benefits}><List items={service.features.map((item) => L(item))} /></Block>
            <Block title={copy.specs}><List items={copy.specRows} /></Block>
            <Block title={copy.steps}><List items={copy.stepRows} ordered /></Block>
            <Block title={copy.materials}><List items={copy.materialRows} /></Block>
            <div className="border-t border-border pt-6">
              <ShareButtons title={L(service.title)} path={`/services/${slug}`} />
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

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{copy.relatedProducts}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <Link key={product.id} to="/products/$slug" params={{ slug: product.id }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
                <img src={product.image} alt={L(product.title)} className="aspect-[16/10] w-full object-cover" loading="lazy" />
                <div className="p-5"><p className="text-xs font-semibold uppercase text-primary">{L(product.category)}</p><h3 className="mt-2 font-semibold text-foreground">{L(product.title)}</h3></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{copy.relatedProjects}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{projects.slice(0, 3).map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
        </div>
      </section>

      <GallerySection
        image={projects[0]?.image ?? heroImg}
        title={L(service.title)}
        source="services"
      />

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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-2xl font-bold text-foreground">{title}</h2><div className="mt-5">{children}</div></section>;
}

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  const Comp = ordered ? "ol" : "ul";
  return (
    <Comp className="grid gap-3 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-soft">
          {ordered ? <span className="font-bold text-primary">{String(index + 1).padStart(2, "0")}</span> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
          <span>{item}</span>
        </li>
      ))}
    </Comp>
  );
}
