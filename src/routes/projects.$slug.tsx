import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Calendar, Layers } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { ProjectCard } from "@/components/site/Cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Button } from "@/components/ui/button";
import { useLang, useLocalized } from "@/i18n/LanguageProvider";
import { projects } from "@/lib/site-data";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug);
    if (!project) throw notFound();
    return { slug: params.slug };
  },
  head: ({ params }) => {
    const project = projects.find((p) => p.slug === params.slug);
    if (!project) {
      return { meta: [{ title: "Project not found — APEX" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${project.title.en} — ${project.location.en} | APEX Projects`;
    const desc = project.overview.en;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/projects/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { property: "og:image", content: project.image },
        { name: "twitter:image", content: project.image },
      ],
      links: [
        { rel: "canonical", href: `/projects/${params.slug}` },
        { rel: "alternate", hrefLang: "en", href: `/projects/${params.slug}` },
        { rel: "alternate", hrefLang: "ar", href: `/projects/${params.slug}` },
        { rel: "alternate", hrefLang: "x-default", href: `/projects/${params.slug}` },
      ],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify([
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title.en,
            description: desc,
            image: project.image,
            url: `/projects/${params.slug}`,
            locationCreated: project.location.en,
            dateCreated: project.year,
            creator: { "@type": "Organization", name: "APEX Sports" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Projects", item: "/projects" },
              { "@type": "ListItem", position: 3, name: project.title.en, item: `/projects/${params.slug}` },
            ],
          },
        ]),
      }],
    };
  },
  component: ProjectDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-24 text-center">
        <p className="text-2xl font-semibold">Project not found</p>
        <Button asChild variant="hero">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

function ProjectDetail() {
  const { slug } = Route.useLoaderData();
  const { t } = useLang();
  const L = useLocalized();
  const project = projects.find((p) => p.slug === slug)!;
  const related = projects.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <SiteLayout>
      <section className="relative min-h-[70vh] overflow-hidden bg-ink pt-16">
        <img src={project.image} alt={L(project.title)} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: t.nav.projects, to: "/projects" }, { label: L(project.title) }]} />
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t.projects.moreProjects}
          </Link>
          <span className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">{project.year}</span>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold text-white sm:text-5xl">{L(project.title)}</h1>
          <p className="mt-4 text-lg text-white/70">{L(project.client)}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground">{t.projects.overview}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{L(project.overview)}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {project.stats.map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                  <p className="text-3xl font-bold text-gradient">{L(s.value)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{L(s.label)}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ShareButtons title={L(project.title)} path={`/projects/${slug}`} />
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-foreground">{t.projects.category}</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <dt className="text-muted-foreground">{t.projects.location}</dt>
                  <dd className="font-medium text-foreground">{L(project.location)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <dt className="text-muted-foreground">{t.projects.year}</dt>
                  <dd className="font-medium text-foreground">{project.year}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <dt className="text-muted-foreground">{t.projects.scope}</dt>
                  <dd className="font-medium text-foreground">{L(project.scope)}</dd>
                </div>
              </div>
            </dl>
            <Button asChild variant="hero" className="mt-6 w-full">
              <Link to="/contact">{t.cta.quote}</Link>
            </Button>
          </aside>
        </div>
      </section>

      <GallerySection
        image={project.image}
        title={L(project.title)}
        toCategory={project.category}
        source="projects"
      />

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
    </SiteLayout>
  );
}
