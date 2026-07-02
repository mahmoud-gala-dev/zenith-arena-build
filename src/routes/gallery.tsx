import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects, projectCategories, articles, services, type L as Localized } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type SourceType = "all" | "projects" | "services" | "knowledge";

const searchSchema = z.object({
  type: z.enum(["all", "projects", "services", "knowledge"]).optional(),
  category: z.string().optional(),
  item: z.string().optional(),
});

export const Route = createFileRoute("/gallery")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Project Gallery — APEX Sports Infrastructure" },
      {
        name: "description",
        content:
          "A visual gallery of football pitches, athletics tracks, indoor arenas, tennis and padel courts, and aquatic centers delivered by APEX.",
      },
      { property: "og:title", content: "Project Gallery — APEX" },
      {
        property: "og:description",
        content: "A visual gallery of world-class sports facilities delivered by APEX.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
    ],
    links: [
      { rel: "canonical", href: "/gallery" },
      { rel: "alternate", hrefLang: "en", href: "/gallery" },
      { rel: "alternate", hrefLang: "ar", href: "/gallery" },
      { rel: "alternate", hrefLang: "x-default", href: "/gallery" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "APEX Project Gallery",
          description:
            "Visual portfolio of sports infrastructure projects, services and technical articles by APEX Sports.",
          associatedMedia: projects.slice(0, 12).map((p) => ({
            "@type": "ImageObject",
            contentUrl: p.image,
            name: p.title.en,
            caption: `${p.title.en} — ${p.location.en}`,
          })),
        }),
      },
    ],
  }),
  component: GalleryPage,
});

interface GalleryItem {
  image: string;
  title: Localized;
  caption: Localized;
  category: string;
  type: Exclude<SourceType, "all">;
  href?: { to: string; params: Record<string, string> };
  span?: string;
}

function GalleryPage() {
  const { lang } = useLang();
  const L = useLocalized();
  const ar = lang === "ar";
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [activeType, setActiveType] = useState<SourceType>(search.type ?? "all");
  const [activeCategory, setActiveCategory] = useState<string>(search.category ?? "all");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    setActiveType(search.type ?? "all");
    setActiveCategory(search.category ?? "all");
  }, [search.type, search.category]);

  const tx = ar
    ? {
        eyebrow: "المعرض",
        title: "مختارات من أعمالنا",
        sub: "لقطات من الملاعب والمنشآت والمعرفة التقنية التي نقدّمها.",
        all: "الكل",
        types: { projects: "المشاريع", services: "الخدمات", knowledge: "المعرفة" },
        empty: "لا توجد عناصر لهذا الفلتر.",
        view: "عرض التفاصيل",
        close: "إغلاق",
        prev: "السابق",
        next: "التالي",
      }
    : {
        eyebrow: "Gallery",
        title: "A visual tour of our work",
        sub: "Snapshots from pitches, arenas, services and technical knowledge we've delivered.",
        all: "All",
        types: { projects: "Projects", services: "Services", knowledge: "Knowledge" },
        empty: "No items match this filter.",
        view: "View details",
        close: "Close",
        prev: "Previous",
        next: "Next",
      };

  // Build unified gallery pool from three sources
  const allItems = useMemo<GalleryItem[]>(() => {
    const projectItems: GalleryItem[] = projects.map((p, idx) => ({
      image: p.image,
      title: p.title,
      caption: p.location,
      category: p.category,
      type: "projects",
      href: { to: "/projects/$slug", params: { slug: p.slug } },
      span: idx % 6 === 0 ? "row-span-2" : "",
    }));

    // Services don't carry their own image; pair each service with a representative
    // project image so the "Services" filter is still visually rich.
    const serviceItems: GalleryItem[] = services.slice(0, 12).map((s, idx) => {
      const match =
        projects.find((p) => p.category === (s.id.includes("football") ? "football" :
          s.id.includes("athletic") ? "athletics" :
          s.id.includes("indoor") || s.id.includes("multi") ? "indoor" :
          s.id.includes("tennis") || s.id.includes("padel") || s.id.includes("racket") ? "racket" :
          s.id.includes("aqua") || s.id.includes("swim") ? "aquatics" : "football")) ??
        projects[idx % projects.length];
      return {
        image: match.image,
        title: s.title,
        caption: s.short,
        category: match.category,
        type: "services",
        href: { to: "/services/$slug", params: { slug: s.id } },
      };
    });

    const knowledgeItems: GalleryItem[] = articles.map((a) => ({
      image: a.image,
      title: a.title,
      caption: a.category,
      category: "knowledge",
      type: "knowledge",
      href: { to: "/knowledge/$slug", params: { slug: a.slug } },
    }));

    return [...projectItems, ...serviceItems, ...knowledgeItems];
  }, []);

  const filtered = useMemo(() => {
    return allItems.filter((it) => {
      if (activeType !== "all" && it.type !== activeType) return false;
      if (activeType === "projects" && activeCategory !== "all" && it.category !== activeCategory)
        return false;
      return true;
    });
  }, [allItems, activeType, activeCategory]);

  const setType = (t: SourceType) => {
    setActiveType(t);
    if (t !== "projects") setActiveCategory("all");
    navigate({ search: { type: t === "all" ? undefined : t, category: undefined }, replace: true });
  };
  const setCategory = (c: string) => {
    setActiveCategory(c);
    navigate({
      search: {
        type: activeType === "all" ? undefined : activeType,
        category: c === "all" ? undefined : c,
      },
      replace: true,
    });
  };

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, filtered.length]);

  const typeChips: { id: SourceType; label: string }[] = [
    { id: "all", label: tx.all },
    { id: "projects", label: tx.types.projects },
    { id: "services", label: tx.types.services },
    { id: "knowledge", label: tx.types.knowledge },
  ];

  const current = lightbox !== null ? filtered[lightbox] : null;

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-4 flex flex-wrap gap-2">
              {typeChips.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setType(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    activeType === c.id
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Reveal>

          {activeType === "projects" && (
            <Reveal>
              <div className="mb-8 flex flex-wrap gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setCategory("all")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    activeCategory === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {tx.all}
                </button>
                {projectCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      activeCategory === c.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {L(c.label)}
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{tx.empty}</p>
          ) : (
            <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((it, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl bg-secondary shadow-soft",
                    it.span,
                  )}
                >
                  <img
                    src={it.image}
                    alt={L(it.title)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink rtl:left-auto rtl:right-3">
                    {tx.types[it.type as keyof typeof tx.types] ?? ""}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left rtl:text-right">
                    <p className="text-sm font-semibold text-white">{L(it.title)}</p>
                    <p className="text-xs text-white/70">{L(it.caption)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {current && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 sm:p-8"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            aria-label={tx.close}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 rtl:left-4 rtl:right-auto"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            aria-label={tx.prev}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label={tx.next}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="flex max-h-[90vh] max-w-6xl flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.image}
              alt={L(current.title)}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-elegant"
            />
            <div className="w-full rounded-2xl bg-white/5 p-4 text-center backdrop-blur">
              <p className="text-lg font-semibold text-white">{L(current.title)}</p>
              <p className="mt-1 text-sm text-white/70">{L(current.caption)}</p>
              {current.href && (
                <Link
                  to={current.href.to}
                  params={current.href.params}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold/90"
                >
                  {tx.view}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
