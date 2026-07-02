import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ArrowRight, Search, ZoomIn, ZoomOut } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroGallery from "@/assets/hero-gallery.jpg.asset.json";
import { Reveal } from "@/components/site/Reveal";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects, projectCategories, articles, services, type L as Localized } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";


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
      { title: "Project Gallery — Egytic Sports" },
      {
        name: "description",
        content:
          "Visual gallery of football pitches, athletics tracks, indoor arenas, tennis and padel courts, and aquatic centres delivered by Egytic Sports.",
      },
      { property: "og:title", content: "Project Gallery — Egytic Sports" },
      {
        property: "og:description",
        content: "A visual gallery of world-class sports facilities delivered by Egytic Sports.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/gallery" },
      { property: "og:image", content: heroGallery.url },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { property: "og:image:alt", content: "Collage of sports facility close-ups" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Project Gallery — Egytic Sports" },
      { name: "twitter:description", content: "Photos from our sports construction portfolio." },
      { name: "twitter:image", content: heroGallery.url },
    ],
    links: [
      { rel: "canonical", href: "/gallery" },
      { rel: "alternate", hrefLang: "en", href: "/gallery" },
      { rel: "alternate", hrefLang: "ar", href: "/gallery" },
      { rel: "alternate", hrefLang: "x-default", href: "/gallery" },
      { rel: "preload", as: "image", href: heroGallery.url, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Egytic Project Gallery",
          description:
            "Visual portfolio of sports infrastructure projects, services and technical articles by Egytic Sports.",
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
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

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
        searchPh: "ابحث في المعرض…",
        zoomIn: "تكبير",
        zoomOut: "تصغير",
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
        searchPh: "Search the gallery…",
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
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
    const q = query.trim().toLowerCase();
    return allItems.filter((it) => {
      if (activeType !== "all" && it.type !== activeType) return false;
      if (activeType === "projects" && activeCategory !== "all" && it.category !== activeCategory)
        return false;
      if (q) {
        const hay = `${it.title.en} ${it.title.ar} ${it.caption.en} ${it.caption.ar} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, activeType, activeCategory, query]);

  const setType = (t: SourceType) => {
    setActiveType(t);
    if (t !== "projects") setActiveCategory("all");
    navigate({ search: { type: t === "all" ? undefined : t, category: undefined }, replace: true });
    const results = allItems.filter((it) => t === "all" || it.type === t).length;
    trackEvent({ name: "gallery_filter", filter_type: "type", value: t, results });
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
    const results = allItems.filter(
      (it) => (activeType === "all" || it.type === activeType) && (c === "all" || it.category === c),
    ).length;
    trackEvent({ name: "gallery_filter", filter_type: "category", value: c, results });
  };

  // Debounced gallery search analytics
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const id = window.setTimeout(() => {
      trackEvent({ name: "gallery_search", query: q, results: filtered.length });
    }, 500);
    return () => window.clearTimeout(id);
  }, [query, filtered.length]);

  // Reset zoom whenever slide changes / closes
  useEffect(() => {
    setZoomed(false);
  }, [lightbox]);

  // Focus restoration + focus trap refs
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const openLightbox = (i: number, ev?: React.MouseEvent<HTMLButtonElement>) => {
    lastTriggerRef.current = (ev?.currentTarget as HTMLElement) ?? (document.activeElement as HTMLElement);
    setLightbox(i);
    const item = filtered[i];
    if (item) {
      trackEvent({
        name: "gallery_lightbox_open",
        index: i,
        total: filtered.length,
        item_title: item.title.en,
        item_type: item.type,
      });
    }
  };

  const closeLightbox = () => {
    if (lightbox !== null) {
      const item = filtered[lightbox];
      trackEvent({
        name: "gallery_lightbox_close",
        index: lightbox,
        item_title: item?.title.en ?? "",
      });
    }
    setLightbox(null);
    // return focus after paint
    window.setTimeout(() => lastTriggerRef.current?.focus?.(), 0);
  };

  const navLightbox = (dir: 1 | -1, via: "keyboard" | "button") => {
    setLightbox((i) => {
      if (i === null) return null;
      const next = (i + dir + filtered.length) % filtered.length;
      trackEvent({ name: "gallery_lightbox_nav", from: i, to: next, via });
      return next;
    });
  };

  // Lightbox keyboard nav + body scroll lock + focus trap
  useEffect(() => {
    if (lightbox === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // move initial focus to close button
    window.setTimeout(() => closeBtnRef.current?.focus?.(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowRight") navLightbox(1, "keyboard");
      if (e.key === "ArrowLeft") navLightbox(-1, "keyboard");
      if (e.key === " " || e.key === "z") setZoomed((z) => !z);
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} bgImage={heroGallery.url} />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {typeChips.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setType(c.id)}
                    aria-pressed={activeType === c.id}
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
              <label className="relative block w-full sm:w-72">
                <span className="sr-only">{tx.searchPh}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tx.searchPh}
                  className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 rtl:pl-4 rtl:pr-9"
                />
              </label>
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
                  onClick={(e) => openLightbox(i, e)}
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
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-3 sm:p-8"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={L(current.title)}
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <button
            aria-label={tx.close}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white shadow-lg backdrop-blur transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white active:scale-95 sm:right-4 sm:top-4 rtl:left-3 rtl:right-auto sm:rtl:left-4"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            aria-label={zoomed ? tx.zoomOut : tx.zoomIn}
            onClick={(e) => {
              e.stopPropagation();
              setZoomed((z) => !z);
            }}
            className="absolute right-3 top-[4.5rem] grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white sm:right-4 sm:top-[5rem] rtl:left-3 rtl:right-auto sm:rtl:left-4"
          >
            {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </button>
          <button
            aria-label={tx.prev}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length));
            }}
            className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white active:scale-95 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label={tx.next}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i + 1) % filtered.length));
            }}
            className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white active:scale-95 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "relative w-full overflow-auto rounded-2xl",
                zoomed ? "max-h-[80vh] cursor-zoom-out" : "max-h-[75vh] cursor-zoom-in",
              )}
              onClick={() => setZoomed((z) => !z)}
            >
              <img
                src={current.image}
                alt={L(current.title)}
                className={cn(
                  "mx-auto h-auto rounded-2xl object-contain shadow-elegant transition-transform duration-300",
                  zoomed ? "max-w-none scale-[1.8] origin-center" : "max-h-[75vh] w-auto max-w-full",
                )}
                draggable={false}
              />
            </div>

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
