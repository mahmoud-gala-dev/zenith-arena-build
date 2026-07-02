import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, User } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ArticleCard } from "@/components/site/Cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { articles } from "@/lib/site-data";

export const Route = createFileRoute("/knowledge/$slug")({
  loader: ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) {
      return { meta: [{ title: "Article not found — APEX" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${article.title.en} | APEX Knowledge Center`;
    const desc = article.excerpt.en;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "author", content: article.author },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/knowledge/${params.slug}` },
        { property: "article:published_time", content: article.date },
        { property: "article:author", content: article.author },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { property: "og:image", content: article.image },
        { name: "twitter:image", content: article.image },
      ],
      links: [
        { rel: "canonical", href: `/knowledge/${params.slug}` },
        { rel: "alternate", hrefLang: "en", href: `/knowledge/${params.slug}` },
        { rel: "alternate", hrefLang: "ar", href: `/knowledge/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: `/knowledge/${params.slug}` },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title.en,
            description: desc,
            image: article.image,
            url: `/knowledge/${params.slug}`,
            author: { "@type": "Person", name: article.author },
            publisher: { "@type": "Organization", name: "APEX Sports" },
            datePublished: article.date,
            articleSection: article.category.en,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Knowledge", item: "/knowledge" },
              { "@type": "ListItem", position: 3, name: article.title.en, item: `/knowledge/${params.slug}` },
            ],
          },
        ]),
      }],
    };
  },
  component: ArticleDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-24 text-center">
        <p className="text-2xl font-semibold">Article not found</p>
        <Button asChild variant="hero">
          <Link to="/knowledge">Back to Knowledge Center</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

function ArticleDetail() {
  const { slug } = Route.useLoaderData();
  const { t, lang } = useLang();
  const L = useLocalized();
  const article = articles.find((a) => a.slug === slug)!;
  const related = articles.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <SiteLayout>
      <article>
        <section className="relative overflow-hidden bg-ink pt-32 pb-14 text-white">
          <img src={article.image} alt={L(article.title)} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: t.nav.knowledge, to: "/knowledge" }, { label: L(article.category) }]} />
            <Link to="/knowledge" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t.knowledge.backToList}
            </Link>
            <span className="mt-6 inline-block rounded-full bg-gradient-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
              {L(article.category)}
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{L(article.title)}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {article.author}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {article.readTime} {t.knowledge.readTime}</span>
              <span>{new Date(article.date).toLocaleDateString(lang === "ar" ? "ar" : "en", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-lg font-medium leading-relaxed text-foreground">{L(article.excerpt)}</p>
            <div className="mt-6 space-y-6">
              {article.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-muted-foreground">{L(p)}</p>
              ))}
            </div>
            <div className="mt-10 border-t border-border pt-6">
              <ShareButtons title={L(article.title)} path={`/knowledge/${slug}`} />
            </div>
            <div className="mt-12 rounded-2xl bg-hero px-8 py-10 text-center">
              <h3 className="text-xl font-bold text-white">{t.sections.ctaTitle}</h3>
              <p className="mx-auto mt-2 max-w-md text-white/70">{t.sections.ctaSub}</p>
              <Button asChild variant="gold" className="mt-6">
                <Link to="/contact">{t.cta.getConsultation}</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>

      <GallerySection image={article.image} title={L(article.title)} source="knowledge" />

      <section className="bg-secondary/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground">{t.knowledge.related}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((a, i) => (
              <Reveal key={a.slug} delay={i * 60}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
