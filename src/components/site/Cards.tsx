import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Icon } from "./Icon";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import type { L } from "@/lib/types";


export type Service = {
  id: string;
  icon: string;
  image: string;
  title: L;
  short: L;
  features: L[];
};
export type Project = {
  slug: string;
  image: string;
  title: L;
  location: L;
  year: string;
  scope: L;
};
export type Article = {
  slug: string;
  image: string;
  title: L;
  excerpt: L;
  category: L;
  date: string;
  readTime: number;
};

function ServiceCardImpl({ service }: { service: Service }) {


  const L = useLocalized();
  const { t } = useLang();
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant focus-within:-translate-y-1 focus-within:shadow-elegant motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0">

      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={service.image}
          alt={L(service.title)}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 text-primary shadow-soft backdrop-blur">
          <Icon name={service.icon} className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-foreground">{L(service.title)}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{L(service.short)}</p>
        <ul className="mt-4 space-y-2">
          {service.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              {L(f)}
            </li>
          ))}
        </ul>
        <Link
          to="/services/$slug"
          params={{ slug: service.id }}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
        >
          {t.cta.learnMore}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function ProjectCardImpl({ project }: { project: Project }) {
  const L = useLocalized();
  const { t } = useLang();
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant focus-visible:-translate-y-1 focus-visible:shadow-elegant motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={project.image}
          alt={L(project.title)}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink rtl:left-auto rtl:right-4">
          {project.year}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-lg font-semibold text-white">{L(project.title)}</h3>
          <p className="mt-1 text-sm text-white/70">{L(project.location)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-5">
        <span className="text-sm text-muted-foreground">{L(project.scope)}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {t.cta.viewProject}
          <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
        </span>
      </div>
    </Link>
  );
}

function ArticleCardImpl({ article }: { article: Article }) {
  const L = useLocalized();
  const { t, lang } = useLang();
  return (
    <Link
      to="/knowledge/$slug"
      params={{ slug: article.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant focus-visible:-translate-y-1 focus-visible:shadow-elegant motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={article.image}
          alt={L(article.title)}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground rtl:left-auto rtl:right-4">
          {L(article.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(article.date).toLocaleDateString(lang === "ar" ? "ar" : "en", { year: "numeric", month: "short", day: "numeric" })}</span>
          <span>·</span>
          <span>{article.readTime} {t.knowledge.readTime}</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {L(article.title)}
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{L(article.excerpt)}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {t.cta.readArticle}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}

// Memoized exports — cards render often inside long grids and their props are
// stable references from parent data, so shallow equality is a safe win.
export const ServiceCard = memo(ServiceCardImpl);
export const ProjectCard = memo(ProjectCardImpl);
export const ArticleCard = memo(ArticleCardImpl);

