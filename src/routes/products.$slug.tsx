import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Download, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { NotFound } from "@/components/site/NotFound";
import { Button } from "@/components/ui/button";
import { DownloadGateButton } from "@/components/site/DownloadGateButton";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import {
  productBySlugQueryOptions,
  productCategoriesQueryOptions,
  productsPublishedQueryOptions,
  type ProductRow,
} from "@/lib/queries";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productBySlugQueryOptions(params.slug));
    if (!product) throw notFound();
    context.queryClient.ensureQueryData(productCategoriesQueryOptions);
    context.queryClient.ensureQueryData(productsPublishedQueryOptions);
    return { slug: params.slug, title: product.title_en, description: product.description_en, image: product.og_image || product.image_url };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const { slug, title, description, image } = loaderData;
    const t = `${title} | Egytic Products`;
    const d = description ?? "";
    const meta: Array<Record<string, string>> = [
      { title: t },
      { name: "description", content: d },
      { property: "og:title", content: t },
      { property: "og:description", content: d },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/products/${slug}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: t },
      { name: "twitter:description", content: d },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: `/products/${slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: title,
          description: d,
          image: image || undefined,
          brand: { "@type": "Brand", name: "Egytic" },
        }),
      }],
    };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => <NotFound backTo="/products" backKey="backToProducts" />,
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useLoaderData();
  const { lang, t } = useLang();
  const ar = lang === "ar";
  const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const { data: categories } = useSuspenseQuery(productCategoriesQueryOptions);
  const { data: allProducts } = useSuspenseQuery(productsPublishedQueryOptions);
  const p = product as ProductRow; // notFound() thrown in loader if null

  const tx = ar
    ? { back: "العودة للمنتجات", features: "المزايا", specs: "المواصفات", variants: "الخيارات المتاحة", applications: "الاستخدامات", certs: "الاعتمادات", downloads: "التحميلات", inquiry: "طلب استفسار", relatedProducts: "منتجات ذات صلة", relatedKnowledge: "مقالات ذات صلة", readArticle: "قراءة المقال" }
    : { back: "Back to products", features: "Features", specs: "Specifications", variants: "Available variants", applications: "Applications", certs: "Certifications", downloads: "Downloads", inquiry: "Send inquiry", relatedProducts: "Related products", relatedKnowledge: "Related knowledge", readArticle: "Read article" };

  const title = ar ? p.title_ar : p.title_en;
  const description = ar ? p.description_ar : p.description_en;
  const content = ar ? p.content_ar : p.content_en;
  const features = (ar ? p.features_ar : p.features_en) ?? [];
  const applications = (ar ? p.applications_ar : p.applications_en) ?? [];
  const cat = p.category_id ? categories.find((c) => c.id === p.category_id) : undefined;
  const catLabel = cat ? (ar ? cat.title_ar : cat.title_en) : "";
  const cert = p.certifications?.[0] ?? "";
  const gallery = Array.isArray(p.gallery) ? (p.gallery as unknown[]).filter((v): v is string => typeof v === "string") : [];
  const specs = p.specifications && typeof p.specifications === "object" ? Object.entries(p.specifications as Record<string, unknown>) : [];
  const variants = Array.isArray(p.variants) ? (p.variants as unknown[]).filter((v): v is string => typeof v === "string") : [];
  const productDownloads = Array.isArray(p.downloads) ? (p.downloads as Array<{ label?: string; url?: string }>) : [];
  const related = allProducts.filter((x) => x.id !== p.id && x.category_id && x.category_id === p.category_id).slice(0, 3);
  const relatedFallback = related.length ? related : allProducts.filter((x) => x.id !== p.id).slice(0, 3);

  const catalogIds = Array.isArray((p as ProductRow & { catalog_download_ids?: string[] }).catalog_download_ids)
    ? ((p as ProductRow & { catalog_download_ids?: string[] }).catalog_download_ids as string[])
    : [];

  const { data: linkedCatalogs = [] } = useQuery({
    queryKey: ["product_linked_catalogs", p.id, catalogIds.join(",")],
    enabled: catalogIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("downloads")
        .select("id,slug_en,slug_ar,title_en,title_ar,description_en,description_ar,category,preview_image,file_url,requires_lead_capture,status")
        .in("id", catalogIds)
        .eq("status", "published");
      return data ?? [];
    },
  });

  const { data: relatedKnowledge = [] } = useQuery({
    queryKey: ["product_related_knowledge", p.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image")
        .eq("status", "published")
        .limit(6);
      return (data ?? []).slice(0, 3);
    },
  });

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-ink pt-32 pb-16 text-white">
        {p.image_url && <img src={p.image_url} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.products, to: "/products" }, { label: title }]} />
        </div>
        <div className="relative mx-auto mt-6 grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {tx.back}</Link>
            {catLabel && <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gold">{catLabel}</p>}
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{title}</h1>
            {description && <p className="mt-4 max-w-xl text-lg text-white/72">{description}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold"><Link to="/quote">{tx.inquiry}</Link></Button>
              {productDownloads[0]?.url && (
                <Button asChild variant="outlineLight">
                  <a href={productDownloads[0].url} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" /> {tx.downloads}
                  </a>
                </Button>
              )}
            </div>
          </div>
          {p.image_url && (
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-elegant">
              <img src={p.image_url} alt={title} className="aspect-[4/3] h-full w-full object-cover" />
              {cert && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink rtl:left-4 rtl:right-auto">
                  <BadgeCheck className="h-4 w-4 text-primary" /> {cert}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-12 lg:col-span-2">
            {content && (
              <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
            )}
            {features.length > 0 && <Block title={tx.features}><List items={features} /></Block>}
            {specs.length > 0 && (
              <Block title={tx.specs}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                  {specs.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-3 border-b border-border last:border-b-0">
                      <div className="bg-secondary/50 p-4 text-sm font-medium text-foreground">{label}</div>
                      <div className="col-span-2 p-4 text-sm text-muted-foreground">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </Block>
            )}
            {applications.length > 0 && <Block title={tx.applications}><List items={applications} /></Block>}
            {p.certifications && p.certifications.length > 0 && (
              <Block title={tx.certs}>
                <div className="flex flex-wrap gap-2">
                  {p.certifications.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> {c}
                    </span>
                  ))}
                </div>
              </Block>
            )}
            {productDownloads.length > 0 && (
              <Block title={tx.downloads}>
                <ul className="space-y-2">
                  {productDownloads.map((d, i) => d.url ? (
                    <li key={i}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:border-primary/40">
                        <Download className="h-4 w-4" /> {d.label || "Download"}
                      </a>
                    </li>
                  ) : null)}
                </ul>
              </Block>
            )}
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground">{tx.variants}</h2>
            <List items={variants.length ? variants : (ar ? ["مواصفة قياسية", "تصميم مخصص حسب المشروع"] : ["Standard specification", "Custom project specification"])} />
            <Button asChild className="mt-6 w-full" variant="hero"><Link to="/quote">{tx.inquiry}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>
          </aside>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((src, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-secondary aspect-[4/3]">
                  <img src={src} alt={`${title} ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedFallback.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">{tx.relatedProducts}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedFallback.map((r) => (
                <Link key={r.id} to="/products/$slug" params={{ slug: r.slug_en }} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
                  {r.image_url && (
                    <div className="mb-4 aspect-[16/10] overflow-hidden rounded-xl">
                      <img src={r.image_url} alt={ar ? r.title_ar : r.title_en} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{ar ? r.title_ar : r.title_en}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ar ? r.description_ar : r.description_en}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedKnowledge.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">{tx.relatedKnowledge}</h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {relatedKnowledge.map((k) => (
                <Link key={k.id} to="/knowledge/$slug" params={{ slug: k.slug_en }} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
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
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">{t.sections.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{t.sections.ctaSub}</p>
          <Button asChild variant="gold" size="lg" className="mt-7"><Link to="/quote">{tx.inquiry}</Link></Button>
        </div>
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
