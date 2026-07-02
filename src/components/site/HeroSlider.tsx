import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageProvider";
import type { Database } from "@/integrations/supabase/types";

type Slide = Database["public"]["Tables"]["hero_slides"]["Row"];

const AUTOPLAY_MS = 6500;

export function HeroSlider({ fallback }: { fallback?: React.ReactNode }) {
  const { lang, isRTL } = useLang();
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (mounted) setSlides(data ?? []);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const count = slides?.length ?? 0;

  useEffect(() => {
    if (!playing || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [playing, count]);

  const current = useMemo(() => (slides && count > 0 ? slides[index % count] : null), [slides, index, count]);

  if (slides === null) {
    return (
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink">
        <div className="absolute inset-0 animate-pulse bg-ink" />
      </section>
    );
  }

  if (count === 0) return <>{fallback}</>;
  if (!current) return null;

  const t = (en?: string | null, ar?: string | null) => (lang === "ar" ? ar || en || "" : en || ar || "");
  const align = current.align === "center" ? "items-center text-center mx-auto" : current.align === "right" ? (isRTL ? "items-start" : "items-end text-right ml-auto") : "items-start text-left";
  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink">
      <AnimatePresence mode="sync">
        <motion.img
          key={current.id + "-img"}
          src={current.image_url}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <div
        className={
          current.overlay === "light"
            ? "absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-ink/60"
            : current.overlay === "none"
            ? "absolute inset-0 bg-ink/20"
            : "absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink"
        }
      />
      <div className="absolute inset-0 grid-texture opacity-30" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`flex max-w-3xl flex-col ${align}`}
          >
            {(current.eyebrow_en || current.eyebrow_ar) && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                {t(current.eyebrow_en, current.eyebrow_ar)}
              </span>
            )}
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl">
              {t(current.title_en, current.title_ar)}
            </h1>
            {(current.subtitle_en || current.subtitle_ar) && (
              <p className="mt-6 max-w-xl text-lg text-white/70">{t(current.subtitle_en, current.subtitle_ar)}</p>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              {current.primary_href && (current.primary_label_en || current.primary_label_ar) && (
                <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground">
                  <Link to={current.primary_href}>{t(current.primary_label_en, current.primary_label_ar)}</Link>
                </Button>
              )}
              {current.secondary_href && (current.secondary_label_en || current.secondary_label_ar) && (
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  <Link to={current.secondary_href}>{t(current.secondary_label_en, current.secondary_label_ar)}</Link>
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <div className="sr-only" aria-hidden="true" />

          <motion.div
            key={current.id + "-bar"}
            initial={{ width: "0%" }}
            animate={{ width: playing ? "100%" : "0%" }}
            transition={{ duration: playing ? AUTOPLAY_MS / 1000 : 0, ease: "linear" }}
            className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-primary"
          />
        </>
      )}
    </section>
  );
}
