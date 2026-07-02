import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Download } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProjectCard } from "@/components/site/Cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { products, projects, services } from "@/lib/site-data";


export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = products.find((item) => item.id === params.slug);
    if (!product) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const product = products.find((item) => item.id === params.slug);
    if (!product) {
      return { meta: [{ title: "Product not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${product.title.en} — ${product.certified} | Egytic Products`;
    const desc = product.description.en;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/products/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: `/products/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title.en,
          description: product.description.en,
          category: product.category.en,
          brand: { "@type": "Brand", name: "Egytic" },
          award: product.certified,
        }),
      }],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useLoaderData();
  const { lang, t } = useLang();
  const L = useLocalized();
  const product = products.find((item) => item.id === slug)!;
  const ar = lang === "ar";
  const tx = ar
    ? { back: "العودة للمنتجات", features: "المزايا", specs: "المواصفات", variants: "الخيارات المتاحة", applications: "الاستخدامات", certs: "الاعتمادات", downloads: "التحميلات", inquiry: "طلب استفسار", relatedServices: "خدمات ذات صلة", relatedProjects: "مشاريع ذات صلة", relatedKnowledge: "مقالات معرفية ذات صلة", readArticle: "قراءة المقال" }
    : { back: "Back to products", features: "Features", specs: "Specifications", variants: "Available variants", applications: "Applications", certs: "Certifications", downloads: "Downloads", inquiry: "Send inquiry", relatedServices: "Related services", relatedProjects: "Related projects", relatedKnowledge: "Related knowledge articles", readArticle: "Read article" };

  const { data: relatedKnowledge = [] } = useQuery({
    queryKey: ["product_related_knowledge", product.id],
    queryFn: async () => {
      const cat = product.category.en.toLowerCase();
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image")
        .eq("status", "published")
        .limit(20);
      const rows = data ?? [];
      // pick posts whose title/excerpt mentions the product category, else fallback to first 3
      const matched = rows.filter((r) =>
        `${r.title_en} ${r.excerpt_en ?? ""}`.toLowerCase().includes(cat.split(" ")[0]),
      );
      return (matched.length ? matched : rows).slice(0, 3);
    },
  });


  const features = ar ? ["أداء ثابت طويل الأمد", "متوافق مع المنشآت الاحترافية", "خيارات ألوان ومواصفات متعددة", "دعم فني أثناء التصميم والتركيب"] : ["Long-term performance", "Professional facility compatibility", "Multiple color and specification options", "Technical support during design and installation"];
  const specs = ar ? [["الفئة", L(product.category)], ["الاعتماد", product.certified], ["الاستخدام", "ملاعب ومنشآت رياضية"], ["الصيانة", "منخفضة إلى متوسطة حسب الاستخدام"]] : [["Category", L(product.category)], ["Certification", product.certified], ["Use", "Sports fields and facilities"], ["Maintenance", "Low to medium depending on usage"]];

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-ink pt-32 pb-16 text-white">
        <img src={product.image} alt={L(product.title)} className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.products, to: "/products" }, { label: L(product.title) }]} />
        </div>
        <div className="relative mx-auto mt-6 grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {tx.back}</Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gold">{L(product.category)}</p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{L(product.title)}</h1>
            <p className="mt-4 max-w-xl text-lg text-white/72">{L(product.description)}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild variant="gold"><Link to="/quote">{tx.inquiry}</Link></Button><Button variant="outlineLight"><Download className="h-4 w-4" /> {tx.downloads}</Button></div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-elegant">
            <img src={product.image} alt={L(product.title)} className="aspect-[4/3] h-full w-full object-cover" />
            <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink rtl:left-4 rtl:right-auto"><BadgeCheck className="h-4 w-4 text-primary" /> {product.certified}</span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-12 lg:col-span-2">
            <Block title={tx.features}><List items={features} /></Block>
            <Block title={tx.specs}>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                {specs.map(([label, value]) => <div key={label} className="grid grid-cols-3 border-b border-border last:border-b-0"><div className="bg-secondary/50 p-4 text-sm font-medium text-foreground">{label}</div><div className="col-span-2 p-4 text-sm text-muted-foreground">{value}</div></div>)}
              </div>
            </Block>
            <Block title={tx.applications}><List items={ar ? ["الأندية والأكاديميات", "المدارس والجامعات", "البلديات والمشاريع الحكومية", "المجمعات السكنية والمنتجعات"] : ["Clubs and academies", "Schools and universities", "Municipal and government projects", "Residential communities and resorts"]} /></Block>
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground">{tx.variants}</h2>
            <List items={ar ? ["مواصفة قياسية", "مواصفة احترافية", "تصميم مخصص حسب المشروع"] : ["Standard specification", "Professional specification", "Custom project specification"]} />
            <Button asChild className="mt-6 w-full" variant="hero"><Link to="/quote">{tx.inquiry}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>
          </aside>
        </div>
      </section>

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{tx.relatedServices}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {services.slice(0, 3).map((service) => (
              <Link key={service.id} to="/services/$slug" params={{ slug: service.id }} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
                <h3 className="text-lg font-semibold text-foreground">{L(service.title)}</h3><p className="mt-2 text-sm text-muted-foreground">{L(service.short)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{tx.relatedProjects}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">{projects.slice(0, 3).map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
        </div>
      </section>

      {relatedKnowledge.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{tx.relatedKnowledge}</h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedKnowledge.map((k) => (
                <Link
                  key={k.id}
                  to="/knowledge/$slug"
                  params={{ slug: k.slug_en }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-elegant"
                >
                  {k.featured_image && (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={k.featured_image} alt={ar ? k.title_ar : k.title_en} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-foreground group-hover:text-primary">{ar ? k.title_ar : k.title_en}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">{ar ? k.excerpt_ar : k.excerpt_en}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {tx.readArticle} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}



      <section className="bg-hero py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"><h2 className="text-3xl font-bold">{t.sections.ctaTitle}</h2><p className="mx-auto mt-3 max-w-xl text-white/70">{t.sections.ctaSub}</p><Button asChild variant="gold" size="lg" className="mt-7"><Link to="/quote">{tx.inquiry}</Link></Button></div>
      </section>
    </SiteLayout>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-2xl font-bold text-foreground">{title}</h2><div className="mt-5">{children}</div></section>;
}

function List({ items }: { items: string[] }) {
  return <ul className="space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-3 text-sm text-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{item}</span></li>)}</ul>;
}
