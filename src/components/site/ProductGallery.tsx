import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X, ArrowRight, Images } from "lucide-react";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import type { L, Product } from "@/lib/site-data";
import { projects, articles } from "@/lib/site-data";
import { cn } from "@/lib/utils";

interface GalleryEntry {
  image: string;
  title: L;
  caption: L;
  badge?: L;
  link?: { kind: "project" | "knowledge"; to: string; params: Record<string, string>; label: L };
}

interface ProductGalleryProps {
  product: Product;
}

// Map product id → project category key used in site-data
function categoryKey(productId: string): string {
  if (productId.includes("turf") || productId.includes("football")) return "football";
  if (productId.includes("track") || productId.includes("run") || productId.includes("athletic")) return "athletics";
  if (productId.includes("sprung") || productId.includes("indoor") || productId.includes("court-multi")) return "indoor";
  if (productId.includes("acrylic") || productId.includes("tennis") || productId.includes("padel") || productId.includes("glass")) return "racket";
  if (productId.includes("aqua") || productId.includes("swim") || productId.includes("pool")) return "aquatics";
  if (productId.includes("led") || productId.includes("light")) return "indoor";
  return "football";
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const { lang } = useLang();
  const L = useLocalized();
  const ar = lang === "ar";
  const [idx, setIdx] = useState<number | null>(null);

  const items = useMemo<GalleryEntry[]>(() => {
    const key = categoryKey(product.id);
    const relatedProjects = projects.filter((p) => p.category === key).slice(0, 4);
    const relatedArticles = articles.slice(0, 3);

    const hero: GalleryEntry = {
      image: product.image,
      title: product.title,
      caption: product.description,
      badge: { en: product.certified, ar: product.certified },
    };

    const projectEntries: GalleryEntry[] = relatedProjects.map((p) => ({
      image: p.image,
      title: p.title,
      caption: p.location,
      badge: ar ? { en: "Case", ar: "مشروع" } : { en: "Project", ar: "مشروع" },
      link: {
        kind: "project",
        to: "/projects/$slug",
        params: { slug: p.slug },
        label: ar ? { en: "View project", ar: "عرض المشروع" } : { en: "View project", ar: "عرض المشروع" },
      },
    }));

    const knowledgeEntries: GalleryEntry[] = relatedArticles.map((a) => ({
      image: a.image,
      title: a.title,
      caption: a.category,
      badge: ar ? { en: "Knowledge", ar: "معرفة" } : { en: "Knowledge", ar: "معرفة" },
      link: {
        kind: "knowledge",
        to: "/knowledge/$slug",
        params: { slug: a.slug },
        label: { en: "Read article", ar: "قراءة المقال" },
      },
    }));

    return [hero, ...projectEntries, ...knowledgeEntries];
  }, [product, ar]);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") setIdx((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setIdx((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, items.length]);

  const copy = ar
    ? { eyebrow: "معرض المنتج", heading: "شاهد المنتج في السياق", sub: "صور من التطبيقات والمشاريع والمقالات المرتبطة." }
    : { eyebrow: "Product gallery", heading: "See the product in context", sub: "Images from real applications, projects and related knowledge." };

  const current = idx !== null ? items[idx] : null;

  return (
    <section className="border-t border-border bg-secondary/30 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{copy.heading}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>
          </div>
          <Images className="hidden h-8 w-8 text-primary/60 sm:block" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl bg-secondary shadow-soft focus:outline-none focus:ring-2 focus:ring-primary",
                i === 0 && "col-span-2 row-span-2 aspect-auto md:col-span-2",
              )}
              aria-label={L(it.title)}
            >
              <img
                src={it.image}
                alt={L(it.title)}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent opacity-70 transition group-hover:opacity-95" />
              {it.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink rtl:left-auto rtl:right-3">
                  {L(it.badge)}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 text-left rtl:text-right">
                <p className="text-sm font-semibold text-white line-clamp-1">{L(it.title)}</p>
                <p className="text-xs text-white/75 line-clamp-1">{L(it.caption)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 sm:p-8"
          onClick={() => setIdx(null)}
          role="dialog"
          aria-modal="true"
          aria-label={L(current.title)}
        >
          <button
            aria-label={ar ? "إغلاق" : "Close"}
            onClick={(e) => { e.stopPropagation(); setIdx(null); }}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 rtl:left-4 rtl:right-auto"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            aria-label={ar ? "السابق" : "Previous"}
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i === null ? null : (i - 1 + items.length) % items.length)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label={ar ? "التالي" : "Next"}
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i === null ? null : (i + 1) % items.length)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div
            className="flex max-h-[90vh] w-full max-w-5xl flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.image}
              alt={L(current.title)}
              loading="eager"
              decoding="async"
              className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-elegant"
            />
            <div className="w-full rounded-2xl bg-white/5 p-4 text-center backdrop-blur">
              <p className="text-lg font-semibold text-white">{L(current.title)}</p>
              <p className="mt-1 text-sm text-white/70">{L(current.caption)}</p>
              {current.link && (
                <Link
                  to={current.link.to}
                  params={current.link.params}
                  onClick={() => setIdx(null)}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-ink hover:bg-gold/90"
                >
                  {L(current.link.label)}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
