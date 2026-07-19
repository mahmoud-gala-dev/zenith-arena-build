import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Layers } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { NotFound } from "@/components/site/NotFound";
import { Reveal } from "@/components/site/Reveal";
import { ProjectCard } from "@/components/site/Cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { GallerySection } from "@/components/site/GallerySection";
import { DetailPageSkeleton } from "@/components/site/Skeletons";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import {
  projectBySlugQueryOptions,
  projectsPublishedListQueryOptions,
  dbProjectToView,
  type DbProject,
} from "@/lib/queries";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const project = await queryClient.ensureQueryData(projectBySlugQueryOptions(params.slug));
    if (!project) throw notFound();
    void queryClient.ensureQueryData(projectsPublishedListQueryOptions);
    return { slug: params.slug, project };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.project as DbProject | undefined;
    if (!p) {
      return { meta: [{ title: "Project not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const title = p.seo_title ?? `${p.title_en} — ${p.location ?? ""} | Egytic Projects`;
    const desc = p.seo_description ?? p.overview_en ?? p.description_en ?? "";
    const url = `/projects/${p.slug_en}`;
    const image = p.cover_image ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "alternate", hrefLang: "en", href: url },
        { rel: "alternate", hrefLang: "ar", href: p.slug_ar ? `/projects/${p.slug_ar}` : url },
        { rel: "alternate", hrefLang: "x-default", href: url },
        ...(image ? [{ rel: "preload", as: "image", href: image, fetchpriority: "high" }] : []),
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: p.title_en,
            description: desc,
            image,
            url,
            locationCreated: p.location ?? undefined,
            dateCreated: p.year ?? undefined,
            creator: { "@type": "Organization", name: "Egytic Sports" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Projects", item: "/projects" },
              { "@type": "ListItem", position: 3, name: p.title_en, item: url },
            ],
          },
        ]),
      }],
    };
  },
  component: ProjectDetail,
  pendingComponent: () => (<SiteLayout><DetailPageSkeleton /></SiteLayout>),
  pendingMs: 200,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-24 text-center">
        <p className="text-2xl font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button asChild variant="hero"><Link to="/projects">Back to projects</Link></Button>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => <NotFound backTo="/projects" backKey="backToProjects" />,
});

function ProjectDetail() {
  const { slug } = Route.useLoaderData();
  const { t } = useLang();
  const L = useLocalized();
  const { data: dbProject } = useSuspenseQuery(projectBySlugQueryOptions(slug));
  const { data: all = [] } = useSuspenseQuery(projectsPublishedListQueryOptions);
  const project = dbProject!;
  const view = dbProjectToView(project);
  const related = all
    .filter((p) => p.id !== project.id)
    .slice(0, 3)
    .map(dbProjectToView);
  const galleryArr = Array.isArray(project.gallery) ? (project.gallery as unknown[]) : [];

  return (
    <SiteLayout>
      <section className="relative min-h-[70vh] overflow-hidden bg-ink pt-16">
        {view.image && (
          <img src={view.image} alt={L(view.title)} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.projects, to: "/projects" }, { label: L(view.title) }]} />
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t.projects.moreProjects}
          </Link>
          {view.year && (
            <span className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">{view.year}</span>
          )}
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-white sm:text-5xl">{L(view.title)}</h1>
          {(project.client) && <p className="mt-4 text-lg text-white/70">{project.client}</p>}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground">{t.projects.overview}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{L(view.overview)}</p>
            {project.area_sqm && (
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                  <p className="text-3xl font-bold text-gradient">{project.area_sqm.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">m²</p>
                </div>
                {project.surface_type && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                    <p className="text-3xl font-bold text-gradient">{project.surface_type}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.projects.scope}</p>
                  </div>
                )}
                {project.year && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                    <p className="text-3xl font-bold text-gradient">{project.year}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.projects.year}</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-8">
              <ShareButtons title={L(view.title)} path={`/projects/${slug}`} />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground">{t.projects.category}</h3>
            <dl className="mt-4 space-y-4 text-sm">
              {(project.location || project.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <dt className="text-muted-foreground">{t.projects.location}</dt>
                    <dd className="font-medium text-foreground">{project.location ?? project.city}</dd>
                  </div>
                </div>
              )}
              {project.year && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <dt className="text-muted-foreground">{t.projects.year}</dt>
                    <dd className="font-medium text-foreground">{project.year}</dd>
                  </div>
                </div>
              )}
              {(project.service_category || project.sport_type) && (
                <div className="flex items-start gap-3">
                  <Layers className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <dt className="text-muted-foreground">{t.projects.scope}</dt>
                    <dd className="font-medium text-foreground">{project.service_category ?? project.sport_type}</dd>
                  </div>
                </div>
              )}
            </dl>
            <Button asChild variant="hero" className="mt-6 w-full">
              <Link to="/contact">{t.cta.quote}</Link>
            </Button>
          </aside>
        </div>
      </section>

      {galleryArr.length > 0 && view.image && (
        <GallerySection
          image={view.image}
          title={L(view.title)}
          toCategory={view.category}
          source="projects"
        />
      )}

      {related.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">{t.projects.moreProjects}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 60}>
                  <ProjectCard project={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
