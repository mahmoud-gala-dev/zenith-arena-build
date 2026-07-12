import { Link } from "@tanstack/react-router";
import { Images, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

interface GallerySectionProps {
  image: string;
  title: string;
  source: "projects" | "services" | "knowledge";
  toCategory?: string;
}

/**
 * Compact "featured image + link to filtered gallery" strip shown near the
 * bottom of every detail page. Deep-links into /gallery with the correct
 * type (and, for projects, the correct category) preselected.
 */
export function GallerySection({ image, title, source, toCategory }: GallerySectionProps) {
  const { t } = useLang();
  const copy = t.components.gallerySection;

  const search: Record<string, string> = { type: source };
  if (source === "projects" && toCategory) search.category = toCategory;

  return (
    <section className="border-t border-border bg-secondary/30 py-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
        <div className="group relative overflow-hidden rounded-3xl shadow-elegant">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:h-96"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <p className="text-lg font-semibold text-white">{title}</p>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
              {copy.eyebrow}
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground">{copy.heading}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{copy.sub}</p>
          <Link
            to="/gallery"
            search={search}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            <Images className="h-4 w-4" />
            {copy.cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
