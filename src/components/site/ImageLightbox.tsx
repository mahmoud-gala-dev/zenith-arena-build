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
  const { lang } = useLang();
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
      aria-label={ar ? "معرض الصور" : "Image gallery"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        aria-label={ar ? "إغلاق" : "Close"}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            aria-label={ar ? "التالي" : "Previous"}
            onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label={ar ? "السابق" : "Next"}
            onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="relative max-h-[90vh] max-w-6xl px-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={url}
          alt={alt ? `${alt} — ${index + 1}` : `${index + 1}`}
          className={`max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-300 cursor-${zoomed ? "zoom-out" : "zoom-in"} ${zoomed ? "scale-150" : "scale-100"}`}
          onClick={() => setZoomed((z) => !z)}
        />
        <div className="mt-3 flex items-center justify-between gap-4 text-white/80 text-sm">
          <button
            aria-label={zoomed ? (ar ? "تصغير" : "Zoom out") : (ar ? "تكبير" : "Zoom in")}
            onClick={() => setZoomed((z) => !z)}
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <span className="tabular-nums">{index + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
}
