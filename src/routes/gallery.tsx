import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import heroGallery from "@/assets/hero-gallery.jpg.asset.json";
import { Reveal } from "@/components/site/Reveal";
import { useLang } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { galleryPublishedQueryOptions, blogPostsPublishedQueryOptions, seoSettingsByRouteQueryOptions } from "@/lib/queries";
import { buildSeoHead } from "@/lib/seo-head";

type SourceType = "all" | "projects" | "knowledge";

const searchSchema = z.object({
  type: z.enum(["all", "projects", "knowledge"]).optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/gallery")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    const [, , seo] = await Promise.all([
      context.queryClient.ensureQueryData(galleryPublishedQueryOptions),
      context.queryClient.ensureQueryData(blogPostsPublishedQueryOptions),
      context.queryClient.ensureQueryData(seoSettingsByRouteQueryOptions("/gallery")),
    ]);
    return { seo };
  },
  head: ({ loaderData }) =>
    buildSeoHead({
      routePath: "/gallery",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Project Gallery — Egytic Sports",
      fallbackTitleAr: "معرض المشاريع — إيجيتك سبورتس",
      fallbackDescEn: "Visual gallery of world-class sports facilities delivered by Egytic Sports.",
      fallbackDescAr: "معرض بصري لمنشآت رياضية عالمية نُفّذت بواسطة إيجيتك سبورتس.",
      extraLinks: [{ rel: "preload", as: "image", href: heroGallery.url }],
    }),

  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: GalleryPage,
});

interface GalleryItem {
  image: string;
  titleEn: string;
  titleAr: string;
  captionEn: string;
  captionAr: string;
  category: string;
  type: Exclude<SourceType, "all">;
  href?: { to: string; params: Record<string, string> };
  span?: string;
}

function GalleryPage() {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: galleryRows } = useSuspenseQuery(galleryPublishedQueryOptions);
  const { data: blogRows } = useSuspenseQuery(blogPostsPublishedQueryOptions);

  const [activeType, setActiveType] = useState<SourceType>(search.type ?? "all");
  const [activeCategory, setActiveCategory] = useState<string>(search.category ?? "all");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setActiveType(search.type ?? "all");
    setActiveCategory(search.category ?? "all");
  }, [search.type, search.category]);

  const tx = T.pages.gallery;

  const allItems = useMemo<GalleryItem[]>(() => {
    const projectItems: GalleryItem[] = galleryRows.map((g, idx) => ({
      image: g.image_url,
      titleEn: g.title_en,
      titleAr: g.title_ar,
      captionEn: g.description_en || g.alt_en || g.category || "",
      captionAr: g.description_ar || g.alt_ar || g.category || "",
      category: g.category || "other",
      type: "projects",
      span: idx % 6 === 0 ? "row-span-2" : "",
    }));

    const knowledgeItems: GalleryItem[] = blogRows
      .filter((b) => b.featured_image)
      .map((b) => ({
        image: b.featured_image!,
        titleEn: b.title_en,
        titleAr: b.title_ar,
        captionEn: b.excerpt_en || "",
        captionAr: b.excerpt_ar || "",
        category: "knowledge",
        type: "knowledge",
        href: { to: "/knowledge/$slug", params: { slug: b.slug_en } },
      }));

    return [...projectItems, ...knowledgeItems];
  }, [galleryRows, blogRows]);

  const projectCategories = useMemo(() => {
    const set = new Set<string>();
    for (const g of galleryRows) if (g.category) set.add(g.category);
    return Array.from(set);
  }, [galleryRows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((it) => {
      if (activeType !== "all" && it.type !== activeType) return false;
      if (activeType === "projects" && activeCategory !== "all" && it.category !== activeCategory) return false;
      if (q) {
        const hay = `${it.titleEn} ${it.titleAr} ${it.captionEn} ${it.captionAr} ${it.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, activeType, activeCategory, query]);

  const setType = (t: SourceType) => {
    setActiveType(t);
    if (t !== "projects") setActiveCategory("all");
    navigate({ search: { type: t === "all" ? undefined : t, category: undefined }, replace: true });
    trackEvent({ name: "gallery_filter", filter_type: "type", value: t, results: filtered.length });
  };
  const setCategory = (c: string) => {
    setActiveCategory(c);
    navigate({ search: { type: activeType === "all" ? undefined : activeType, category: c === "all" ? undefined : c }, replace: true });
    trackEvent({ name: "gallery_filter", filter_type: "category", value: c, results: filtered.length });

  };

  useEffect(() => { setZoomed(false); }, [lightbox]);

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const openLightbox = (i: number, ev?: React.MouseEvent<HTMLButtonElement>) => {
    lastTriggerRef.current = (ev?.currentTarget as HTMLElement) ?? (document.activeElement as HTMLElement);
    setLightbox(i);
  };
  const closeLightbox = () => {
    setLightbox(null);
    window.setTimeout(() => lastTriggerRef.current?.focus?.(), 0);
  };
  const navLightbox = (dir: 1 | -1) => {
    setLightbox((i) => (i === null ? null : (i + dir + filtered.length) % filtered.length));
  };

  useEffect(() => {
    if (lightbox === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeBtnRef.current?.focus?.(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); return; }
      if (e.key === "ArrowRight") navLightbox(1);
      if (e.key === "ArrowLeft") navLightbox(-1);
      if (e.key === " " || e.key === "z") setZoomed((z) => !z);
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
    { id: "knowledge", label: tx.types.knowledge },
  ];

  const current = lightbox !== null ? filtered[lightbox] : null;
  const currentTitle = current ? (ar ? current.titleAr : current.titleEn) : "";
  const currentCaption = current ? (ar ? current.captionAr : current.captionEn) : "";

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
                    className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-all", activeType === c.id ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card hover:border-primary/40")}
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

          {activeType === "projects" && projectCategories.length > 0 && (
            <Reveal>
              <div className="mb-8 flex flex-wrap gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setCategory("all")}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all", activeCategory === "all" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40")}
                >
                  {tx.all}
                </button>
                {projectCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all", activeCategory === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40")}
                  >
                    {c}
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
                  className={cn("group relative overflow-hidden rounded-xl bg-secondary shadow-soft", it.span)}
                >
                  <img
                    src={it.image}
                    alt={ar ? it.titleAr : it.titleEn}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink rtl:left-auto rtl:right-3">
                    {tx.types[it.type as keyof typeof tx.types] ?? ""}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left rtl:text-right">
                    <p className="text-sm font-semibold text-white">{ar ? it.titleAr : it.titleEn}</p>
                    <p className="text-xs text-white/70">{ar ? it.captionAr : it.captionEn}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {current && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[80] flex flex-col bg-ink/95"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={currentTitle}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) > 50) navLightbox(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          {/* top bar */}
          <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs tabular-nums text-white/80 sm:text-sm">
              {(lightbox ?? 0) + 1} / {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label={zoomed ? tx.zoomOut : tx.zoomIn} onClick={() => setZoomed((z) => !z)} className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button
                ref={closeBtnRef}
                aria-label={tx.close}
                onClick={closeLightbox}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* stage */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            {filtered.length > 1 && (
              <>
                <button
                  aria-label={tx.prev}
                  onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
                  className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-4 sm:p-3"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  aria-label={tx.next}
                  onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
                  className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-4 sm:p-3"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}
            <div className="flex h-full w-full items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
              <img
                src={current.image}
                alt={currentTitle}
                className={cn(
                  "max-h-full max-w-full rounded-xl object-contain transition-transform duration-300",
                  zoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in",
                )}
                onClick={() => setZoomed((z) => !z)}
              />
            </div>
          </div>

          {/* caption + actions */}
          <div className="shrink-0 px-4 pb-1 pt-2 text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold sm:text-lg">{currentTitle}</p>
                {currentCaption && <p className="truncate text-xs text-white/70 sm:text-sm">{currentCaption}</p>}
              </div>
              {current.href && (
                <Link to={current.href.to} params={current.href.params} className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                  {T.pages.gallery.view}
                </Link>
              )}
            </div>
          </div>

          {/* thumbnail carousel */}
          {filtered.length > 1 && (
            <div className="shrink-0 overflow-x-auto px-3 pb-4 pt-2 sm:px-6" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto flex w-max gap-2">
                {filtered.map((item, i) => (
                  <button
                    key={item.id ?? `${item.image}-${i}`}
                    type="button"
                    onClick={() => { setLightbox(i); setZoomed(false); }}
                    aria-current={i === lightbox}
                    aria-label={`${i + 1}`}
                    className={cn(
                      "h-12 w-16 shrink-0 overflow-hidden rounded-md border transition sm:h-16 sm:w-24",
                      i === lightbox ? "border-white opacity-100" : "border-white/20 opacity-60 hover:opacity-100",
                    )}
                  >
                    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </SiteLayout>
  );
}
