import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import type { Database } from "@/integrations/supabase/types";
import { heroSlidesActiveQueryOptions } from "@/lib/queries";

import { CinematicBackdrop } from "./CinematicBackdrop";
import { Logo } from "./Logo";
import { trackEvent } from "@/lib/analytics";

type Slide = Database["public"]["Tables"]["hero_slides"]["Row"];

type HeroAnim = {
  initial: Record<string, number | undefined>;
  animate: Record<string, number | undefined>;
  exit: Record<string, number | undefined>;
  transition: { duration: number; ease?: "easeOut" };
};

type HeroSectionProps = {
  current: Slide;
  count: number;
  slides: Slide[];
  index: number;
  setIndex: (i: number) => void;
  imgAnim: HeroAnim;
  textAnim: HeroAnim;
  t: (en?: string | null, ar?: string | null) => string;
  align: string;
  showCTA: boolean;
  isRTL: boolean;
  onPauseChange?: (paused: boolean) => void;
};

const AUTOPLAY_MS = 6500;

export function HeroSlider({ fallback }: { fallback?: React.ReactNode }) {
  const { lang, isRTL } = useLang();
  const reduceMotion = useReducedMotion();
  const { data: slides = null, isLoading } = useQuery<Slide[]>({
    ...heroSlidesActiveQueryOptions,
  });
  const [index, setIndex] = useState(0);

  const count = slides?.length ?? 0;
  // Ref-based pause avoids re-rendering / resetting the autoplay interval on hover.
  const pausedRef = useRef(false);
  const setPaused = (v: boolean) => { pausedRef.current = v; };
  const slidesRef = useRef(slides);
  slidesRef.current = slides;

  const prevIndexRef = useRef(0);
  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => {
        const next = (i + 1) % count;
        const to = slidesRef.current?.[next];
        if (to) trackEvent({ name: "hero_slide_change", from: i, to: next, slide_id: to.id, via: "autoplay" });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count]);

  const current = useMemo(() => (slides && count > 0 ? slides[index % count] : null), [slides, index, count]);

  useEffect(() => {
    if (current) trackEvent({ name: "hero_slide_view", index, slide_id: current.id, total: count });
    prevIndexRef.current = index;
  }, [current, index, count]);

  if (slides === null || isLoading) {
    return (
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink" aria-label="Loading hero" aria-busy="true">
        <div className="absolute inset-0 animate-pulse bg-ink" />
      </section>
    );
  }


  if (count === 0) return <>{fallback}</>;
  if (!current) return null;

  const t = (en?: string | null, ar?: string | null) => (lang === "ar" ? ar || en || "" : en || ar || "");
  const align = current.align === "center" ? "items-center text-center mx-auto" : current.align === "right" ? (isRTL ? "items-start" : "items-end text-right ml-auto") : "items-start text-left";
  const showCTA = !current.hide_cta;

  const imgAnim = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 0.6 }, exit: { opacity: 0 }, transition: { duration: 0.4 } }
    : { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 0.6, scale: 1 }, exit: { opacity: 0 }, transition: { duration: 1.1, ease: "easeOut" as const } };

  const textAnim = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } }
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 }, transition: { duration: 0.7, ease: "easeOut" as const } };

  return (
    <HeroSection
      current={current}
      count={count}
      slides={slides!}
      index={index}
      setIndex={setIndex}
      imgAnim={imgAnim}
      textAnim={textAnim}
      t={t}
      align={align}
      showCTA={showCTA}
      isRTL={isRTL}
      onPauseChange={setPaused}
    />
  );
}

function HeroSection({ current, count, slides, index, setIndex, imgAnim, textAnim, t, align, showCTA, isRTL, onPauseChange }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 180]);
  const bgScale = useTransform(scrollY, [0, 800], [1, 1.08]);
  const contentY = useTransform(scrollY, [0, 600], [0, -60]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0.2]);
  const dotRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onDotsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (count < 2) return;
    const forward = isRTL ? "ArrowLeft" : "ArrowRight";
    const back = isRTL ? "ArrowRight" : "ArrowLeft";
    let next = index;
    if (e.key === forward) next = (index + 1) % count;
    else if (e.key === back) next = (index - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    else return;
    e.preventDefault();
    const to = slides?.[next];
    if (to) {
      trackEvent({ name: "hero_keyboard_nav", key: e.key, index: next, slide_id: to.id });
      trackEvent({ name: "hero_slide_change", from: index, to: next, slide_id: to.id, via: "keyboard" });
    }
    setIndex(next);
    dotRefs.current[next]?.focus();
  };

  const onDotClick = (i: number) => {
    const to = slides?.[i];
    if (to && i !== index) {
      trackEvent({ name: "hero_dot_click", index: i, slide_id: to.id });
      trackEvent({ name: "hero_slide_change", from: index, to: i, slide_id: to.id, via: "dot_click" });
    }
    setIndex(i);
  };

  return (
    <section
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
      onMouseEnter={() => onPauseChange?.(true)}
      onMouseLeave={() => onPauseChange?.(false)}
      onFocus={() => onPauseChange?.(true)}
      onBlur={() => onPauseChange?.(false)}
    >
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }} aria-hidden>
        <AnimatePresence mode="sync">
          <motion.img
            key={current.id + "-img"}
            src={current.image_url}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            {...imgAnim}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      </motion.div>

      <div
        aria-hidden
        className={
          current.overlay === "light"
            ? "absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-ink/60"
            : current.overlay === "none"
            ? "absolute inset-0 bg-ink/20"
            : "absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink"
        }
      />
      <CinematicBackdrop
        fog={current.fog_intensity ?? 0.6}
        spotlights={current.spotlight_intensity ?? 0.6}
        vignette={current.vignette_intensity ?? 0.6}
      />
      <div className="absolute inset-0 grid-texture opacity-30" aria-hidden />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
        <Logo
          light
          className="mb-8 hidden sm:block [&_img]:!h-40 md:[&_img]:!h-56 lg:[&_img]:!h-64 xl:[&_img]:!h-72"
        />
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`${(index % count) + 1} of ${count}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              {...textAnim}
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
              {showCTA && (
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
              )}

              {count > 1 && (
                <div
                  className="mt-10 flex items-center gap-2"
                  role="tablist"
                  aria-label="Hero slides"
                  onKeyDown={onDotsKeyDown}
                >
                  {slides!.map((s: Slide, i: number) => {
                    const selected = i === index;
                    return (
                      <button
                        key={s.id}
                        ref={(el) => { dotRefs.current[i] = el; }}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-label={`Slide ${i + 1} of ${count}`}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onDotClick(i)}
                        className={`h-2.5 min-h-[16px] min-w-[16px] rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${selected ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"}`}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}


