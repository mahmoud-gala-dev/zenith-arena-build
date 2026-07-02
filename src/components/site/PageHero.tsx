import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-hero pt-32 pb-16 text-white">
      <div className="absolute inset-0 grid-texture opacity-20" />
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <span className="h-px w-6 bg-gold" />
            {eyebrow}
          </span>
        )}
        <h1
          className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl"
          style={{ animation: "fade-up 0.7s ease-out both" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 max-w-2xl text-lg text-white/70" style={{ animation: "fade-up 0.7s ease-out 0.1s both" }}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
