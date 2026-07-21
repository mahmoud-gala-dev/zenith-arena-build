import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, User, ListOrdered, BookOpen, Compass, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { NotFound } from "@/components/site/NotFound";
import { ShareButtons } from "@/components/site/ShareButtons";
import { GallerySection } from "@/components/site/GallerySection";
import { DetailPageSkeleton } from "@/components/site/Skeletons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/i18n/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { alternatesFromGroup } from "@/lib/sitemap";

type ContentType = "article" | "guide" | "case_study";

interface BlogPost {
  id: string;
  slug_en: string;
  title_en: string;
  title_ar: string;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  featured_image: string | null;
  author_name: string;
  reading_time: number;
  published_at: string | null;
  seo_title_en: string | null;
  seo_title_ar: string | null;
  seo_description_en: string | null;
  seo_description_ar: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  canonical_url_en: string | null;
  canonical_url_ar: string | null;
  noindex: boolean | null;
  tags: string[];
  translation_group_id: string | null;
  content_type: ContentType | null;
}

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug_en", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data as BlogPost | null;
}


async function fetchAlternates(post: BlogPost): Promise<{ en: string; ar: string }> {
  if (!post.translation_group_id) {
    return alternatesFromGroup([], post.slug_en);
  }
  const { data } = await supabase
    .from("blog_posts")
    .select("slug_en,slug_ar,content_en,content_ar")
    .eq("translation_group_id", post.translation_group_id)
    .eq("status", "published");
  return alternatesFromGroup(data ?? [], post.slug_en);
}

export const Route = createFileRoute("/knowledge/$slug")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug);
    if (!post) throw notFound();
    const alternates = await fetchAlternates(post);
    return { post, alternates };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) {
      return { meta: [{ title: "Article not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const title = p.seo_title_en?.trim() || `${p.title_en} | Egytic Knowledge Center`;
    const titleAr = p.seo_title_ar?.trim() || p.title_ar;
    const desc = p.seo_description_en?.trim() || p.excerpt_en || p.title_en;
    const descAr = p.seo_description_ar?.trim() || p.excerpt_ar || p.title_ar;
    const image = p.og_image?.trim() || p.featured_image || undefined;
    const path = `/knowledge/${p.slug_en}`;
    const alt = loaderData?.alternates ?? { en: path, ar: `${path}?lang=ar` };

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { name: "author", content: p.author_name },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: path },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (p.seo_keywords) meta.push({ name: "keywords", content: p.seo_keywords });
    if (p.published_at) {
      meta.push({ property: "article:published_time", content: p.published_at });
    }
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    // Arabic overrides via property:lang
    meta.push({ property: "og:title:ar", content: titleAr });
    meta.push({ property: "og:description:ar", content: descAr });

    return {
      meta,
      links: [
        { rel: "canonical", href: path },
        { rel: "alternate", hrefLang: "en", href: alt.en },
        { rel: "alternate", hrefLang: "ar", href: alt.ar },
        { rel: "alternate", hrefLang: "x-default", href: alt.en },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title_en,
            description: desc,
            image: image ? [image] : undefined,
            url: path,
            keywords: p.seo_keywords || undefined,
            author: { "@type": "Person", name: p.author_name },
            publisher: { "@type": "Organization", name: "Egytic Sports" },
            datePublished: p.published_at,
            dateModified: p.published_at,
            inLanguage: ["en", "ar"],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Knowledge", item: "/knowledge" },
              { "@type": "ListItem", position: 3, name: p.title_en, item: path },
            ],
          },
        ]),
      }],
    };
  },
  component: ArticleDetail,
  pendingComponent: () => (<SiteLayout><DetailPageSkeleton /></SiteLayout>),
  pendingMs: 200,
  notFoundComponent: () => <NotFound backTo="/knowledge" backKey="backToKnowledge" />,
});

function ArticleDetail() {
  const { post } = Route.useLoaderData();
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const contentType: ContentType = (post.content_type ?? "article") as ContentType;

  const { data: related = [] } = useQuery({
    queryKey: ["blog_related", post.id, contentType],
    queryFn: async () => {
      const { data: sameType } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image,content_type")
        .eq("status", "published")
        .eq("content_type", contentType)
        .neq("id", post.id)
        .limit(3);
      if ((sameType?.length ?? 0) >= 3) return sameType ?? [];
      const excludeIds = [post.id, ...(sameType ?? []).map((s) => s.id)];
      const { data: fallback } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,excerpt_en,excerpt_ar,featured_image,content_type")
        .eq("status", "published")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .limit(3 - (sameType?.length ?? 0));
      return [...(sameType ?? []), ...(fallback ?? [])];
    },
  });

  const { data: siblings } = useQuery({
    queryKey: ["blog_siblings", post.id, contentType],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,slug_en,title_en,title_ar,published_at,content_type")
        .eq("status", "published")
        .eq("content_type", contentType)
        .order("published_at", { ascending: false, nullsFirst: false });
      const list = data ?? [];
      const idx = list.findIndex((p) => p.id === post.id);
      return {
        prev: idx > 0 ? list[idx - 1] : null,
        next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null,
      };
    },
  });
  const prev = siblings?.prev ?? null;
  const next = siblings?.next ?? null;



  const title = ar ? post.title_ar : post.title_en;
  const excerpt = ar ? post.excerpt_ar : post.excerpt_en;
  const content = ar ? post.content_ar : post.content_en;

  // Parse content into blocks: `## Heading` → h2 with id, otherwise paragraph.
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").slice(0, 80);
  type Block = { kind: "h2"; id: string; text: string } | { kind: "p"; id: string; text: string };
  const blocks: Block[] = (content || "")
    .split(/\n\n+/)
    .map((b: string) => b.trim())
    .filter((b: string) => Boolean(b))
    .map((b: string, i: number): Block => {
      const m = /^##\s+(.+)$/.exec(b);
      if (m) {
        const text = m[1].trim();
        return { kind: "h2", id: `${slugify(text)}-${i}`, text };
      }
      return { kind: "p", id: `p-${i}`, text: b };
    });
  const toc = blocks.filter((b: Block): b is Extract<Block, { kind: "h2" }> => b.kind === "h2");

  const [activeId, setActiveId] = useState<string>("");
  useEffect(() => {
    if (toc.length === 0) return;
    setActiveId(toc[0].id);
    const els = toc.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        } else {
          // Fallback: pick the last heading above the viewport top
          const above = els
            .map((el) => ({ id: el.id, top: el.getBoundingClientRect().top }))
            .filter((x) => x.top < 120)
            .sort((a, b) => b.top - a.top);
          if (above[0]) setActiveId(above[0].id);
        }
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc.map((h) => h.id).join("|")]);

  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setMobileTocOpen(false);
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
    if (typeof history !== "undefined") history.replaceState(null, "", `#${id}`);
  };


  // Reading progress bar based on article scroll extent.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const article = document.getElementById("kc-article-body");
    if (!article) return;
    const onScroll = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(1);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(scrolled / total);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [post.id]);

  const estimatedReading = useMemo(() => {
    if (post.reading_time && post.reading_time > 0) return post.reading_time;
    const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }, [content, post.reading_time]);

  const typeMeta: Record<ContentType, { icon: typeof BookOpen; label: string }> = {
    article: { icon: FileText, label: t.knowledgeArticle.types.article },
    guide: { icon: Compass, label: t.knowledgeArticle.types.guide },
    case_study: { icon: BookOpen, label: t.knowledgeArticle.types.case_study },
  };
  const TypeIcon = typeMeta[contentType].icon;

  return (
    <SiteLayout>
      {/* Reading progress bar */}
      <div
        role="progressbar"
        aria-label={t.knowledgeArticle.readingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
      >
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <article>
        <section className="relative overflow-hidden bg-ink pt-32 pb-14 text-white">
          {post.featured_image && (
            <img src={post.featured_image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[{ label: t.nav.knowledge, to: "/knowledge" }, { label: title }]} />
            <Link to="/knowledge" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t.knowledge.backToList}
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="inline-flex items-center gap-1.5 bg-white/10 text-white hover:bg-white/15">
                <TypeIcon className="h-3.5 w-3.5" />
                {typeMeta[contentType].label}
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author_name}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {estimatedReading} {t.knowledgeArticle.minRead}</span>
              {post.published_at && (
                <span>{new Date(post.published_at).toLocaleDateString(ar ? "ar" : "en", { year: "numeric", month: "long", day: "numeric" })}</span>
              )}
            </div>
          </div>
        </section>



        <section className="py-14">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
            {/* Table of Contents (desktop) */}
            {toc.length > 0 && (
              <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.knowledgeArticle.toc}
                  </p>
                  <TocList toc={toc} activeId={activeId} onNavigate={handleTocClick} />
                </div>
              </aside>
            )}

            <div id="kc-article-body" className={toc.length > 0 ? "min-w-0" : "min-w-0 lg:col-span-2"}>
              {excerpt && <p className="text-lg font-medium leading-relaxed text-foreground">{excerpt}</p>}
              <div className="mt-6 space-y-6">
                {blocks.map((b) =>
                  b.kind === "h2" ? (
                    <h2
                      key={b.id}
                      id={b.id}
                      className="scroll-mt-24 pt-2 text-2xl font-bold text-foreground"
                    >
                      {b.text}
                    </h2>
                  ) : (
                    <p key={b.id} className="leading-relaxed text-muted-foreground whitespace-pre-line">
                      {b.text}
                    </p>
                  ),
                )}
              </div>
              <div className="mt-10 border-t border-border pt-6">
                <ShareButtons title={title} path={`/knowledge/${post.slug_en}`} />
              </div>

              {(prev || next) && (
                <nav
                  aria-label={`${t.knowledgeArticle.previous} / ${t.knowledgeArticle.next}`}
                  className="mt-10 grid gap-4 sm:grid-cols-2"
                >
                  {prev ? (
                    <Link
                      to="/knowledge/$slug"
                      params={{ slug: prev.slug_en }}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-start shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                        {t.knowledgeArticle.previous}
                      </span>
                      <span className="mt-2 font-semibold text-foreground group-hover:text-primary line-clamp-2">
                        {ar ? prev.title_ar : prev.title_en}
                      </span>
                    </Link>
                  ) : <span />}
                  {next ? (
                    <Link
                      to="/knowledge/$slug"
                      params={{ slug: next.slug_en }}
                      className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-end shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant sm:items-end"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.knowledgeArticle.next}
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </span>
                      <span className="mt-2 font-semibold text-foreground group-hover:text-primary line-clamp-2">
                        {ar ? next.title_ar : next.title_en}
                      </span>
                    </Link>
                  ) : <span />}
                </nav>
              )}

              <div className="mt-12 rounded-2xl bg-hero px-8 py-10 text-center">
                <h3 className="text-xl font-bold text-white">{t.sections.ctaTitle}</h3>
                <p className="mx-auto mt-2 max-w-md text-white/70">{t.sections.ctaSub}</p>
                <Button asChild variant="gold" className="mt-6">
                  <Link to="/contact">{t.cta.getConsultation}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>



        {/* Mobile floating TOC button + drawer */}
        {toc.length > 0 && (
          <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={t.knowledgeArticle.toc}
                className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:brightness-110 lg:hidden"
              >
                <ListOrdered className="h-4 w-4" />
                <span>{t.knowledgeArticle.tocMobile}</span>
              </button>
            </SheetTrigger>
            <SheetContent side={ar ? "right" : "left"} className="w-[85vw] max-w-sm overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.knowledgeArticle.toc}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <TocList toc={toc} activeId={activeId} onNavigate={handleTocClick} />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </article>



      {post.featured_image && (
        <GallerySection image={post.featured_image} title={title} source="knowledge" />
      )}

      {related.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">{t.knowledge.related}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((a, i) => (
                <Reveal key={a.id} delay={i * 60}>
                  <Link
                    to="/knowledge/$slug"
                    params={{ slug: a.slug_en }}
                    className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-elegant"
                  >
                    {a.featured_image && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={a.featured_image} alt={ar ? a.title_ar : a.title_en} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-foreground group-hover:text-primary">{ar ? a.title_ar : a.title_en}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ar ? a.excerpt_ar : a.excerpt_en}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function TocList({
  toc,
  activeId,
  onNavigate,
}: {
  toc: { id: string; text: string }[];
  activeId: string;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <nav aria-label="Table of contents">
      <ol className="space-y-2 text-sm">
        {toc.map((h, i) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                onClick={(e) => onNavigate(e, h.id)}
                aria-current={active ? "location" : undefined}
                className={`flex gap-2 border-s-2 ps-3 py-1 transition ${
                  active
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary"
                }`}
              >
                <span className={active ? "text-primary" : "text-primary/60"}>{i + 1}.</span>
                <span className="line-clamp-2">{h.text}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

