import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects, projectCategories } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({
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
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { lang } = useLang();
  const L = useLocalized();
  const ar = lang === "ar";
  const [active, setActive] = useState<string>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const tx = ar
    ? { eyebrow: "المعرض", title: "مختارات من أعمالنا", sub: "لقطات من الملاعب والمنشآت التي نفّذناها.", all: "الكل" }
    : { eyebrow: "Gallery", title: "A visual tour of our work", sub: "Snapshots from pitches, arenas and facilities we've delivered.", all: "All" };

  // Build gallery from project images (duplicated across variants for a richer grid)
  const items = projects.flatMap((p, idx) => [
    { image: p.image, category: p.category, title: p.title, span: idx % 5 === 0 ? "row-span-2" : "" },
    { image: p.image, category: p.category, title: p.title, span: "" },
  ]);

  const filtered = active === "all" ? items : items.filter((i) => i.category === active);

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex flex-wrap gap-2">
              <button
                onClick={() => setActive("all")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  active === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
                )}
              >
                {tx.all}
              </button>
              {projectCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {L(c.label)}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((it, i) => (
              <button
                key={i}
                onClick={() => setLightbox(it.image)}
                className={cn("group relative overflow-hidden rounded-xl bg-secondary shadow-soft", it.span)}
              >
                <img
                  src={it.image}
                  alt={L(it.title)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-3 left-3 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 rtl:left-auto rtl:right-3">
                  {L(it.title)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 rtl:left-6 rtl:right-auto"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-elegant" />
        </div>
      )}
    </SiteLayout>
  );
}
