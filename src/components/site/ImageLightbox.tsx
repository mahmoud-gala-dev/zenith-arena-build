import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

interface Props {
  images: string[];
  index: number | null;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
  alt?: string;
}

export function ImageLightbox({ images, index, onClose, onNavigate, alt }: Props) {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const [zoomed, setZoomed] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => { setZoomed(false); }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onNavigate(ar ? -1 : 1);
      else if (e.key === "ArrowLeft") onNavigate(ar ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, onClose, onNavigate, ar]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) onNavigate(dx < 0 ? 1 : -1);
    touchX.current = null;
  }, [onNavigate]);

  if (index === null) return null;
  const url = images[index];
  if (!url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.components.lightbox.gallery}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs tabular-nums text-white/80 sm:text-sm">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            aria-label={zoomed ? t.components.lightbox.zoomOut : t.components.lightbox.zoomIn}
            onClick={() => setZoomed((z) => !z)}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            aria-label={t.components.lightbox.close}
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>

      {/* stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {images.length > 1 && (
          <>
            <button
              aria-label={t.components.lightbox.prev}
              onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4 sm:p-3"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              aria-label={t.components.lightbox.next}
              onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4 sm:p-3"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        <div className="flex h-full w-full items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
          <img
            src={url}
            alt={alt ? `${alt} — ${index + 1}` : `${index + 1}`}
            className={`max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-300 ${zoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
            onClick={() => setZoomed((z) => !z)}
          />
        </div>
      </div>

      {/* thumbnail carousel */}
      {images.length > 1 && (
        <div className="shrink-0 overflow-x-auto px-3 pb-4 pt-2 sm:px-6" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto flex w-max gap-2">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => onNavigate((i - index) as 1 | -1)}
                aria-label={`${i + 1}`}
                aria-current={i === index}
                className={`h-12 w-16 shrink-0 overflow-hidden rounded-md border transition sm:h-16 sm:w-24 ${
                  i === index ? "border-white opacity-100" : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

