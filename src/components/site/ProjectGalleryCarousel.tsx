import { useState } from "react";
import { Expand } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageLightbox } from "@/components/site/ImageLightbox";
import { useLang } from "@/i18n/LanguageProvider";

interface Props {
  images: string[];
  title: string;
}

/** Cinematic carousel of project photos with thumbnails and a fullscreen lightbox. */
export function ProjectGalleryCarousel({ images, title }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!images.length) return null;

  return (
    <section className="border-t border-border bg-secondary/30 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {ar ? "معرض المشروع" : "Project gallery"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {ar ? `${images.length} صورة` : `${images.length} photos`}
          </p>
        </div>

        <Carousel
          opts={{ loop: true, direction: ar ? "rtl" : "ltr" }}
          className="mt-8"
        >
          <CarouselContent>
            {images.map((url, i) => (
              <CarouselItem key={`${url}-${i}`} className="md:basis-4/5 lg:basis-3/4">
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="group relative block w-full overflow-hidden rounded-3xl shadow-elegant"
                  aria-label={ar ? "تكبير الصورة" : "Open image"}
                >
                  <img
                    src={url}
                    alt={`${title} — ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] sm:h-96 lg:h-[520px]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-70" />
                  <span className="absolute bottom-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur ltr:right-4 rtl:left-4">
                    <Expand className="h-3.5 w-3.5" />
                    {i + 1} / {images.length}
                  </span>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {images.map((url, i) => (
            <button
              key={`thumb-${url}-${i}`}
              type="button"
              onClick={() => { setActive(i); setLightbox(i); }}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                active === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`${title} — ${i + 1}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      <ImageLightbox
        images={images}
        index={lightbox}
        alt={title}
        onClose={() => setLightbox(null)}
        onNavigate={(dir) =>
          setLightbox((cur) => (cur === null ? cur : (cur + dir + images.length) % images.length))
        }
      />
    </section>
  );
}
