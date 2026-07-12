import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Tag } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import {
  downloadBySlugQueryOptions,
  downloadsPublishedQueryOptions,
  downloadsPageSettingsQueryOptions,
  type DownloadRow,
} from "@/lib/queries";

export const Route = createFileRoute("/downloads/$slug")({
  loader: async ({ params, context: { queryClient } }) => {
    const item = await queryClient.ensureQueryData(downloadBySlugQueryOptions(params.slug));
    if (!item) throw notFound();
    void queryClient.ensureQueryData(downloadsPublishedQueryOptions);
    void queryClient.ensureQueryData(downloadsPageSettingsQueryOptions);
    return { slug: params.slug, item };
  },
  head: ({ loaderData }) => {
    const d = loaderData?.item as DownloadRow | undefined;
    if (!d) {
      return { meta: [{ title: "Download not found — Egytic" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${d.title_en} — Egytic Downloads`;
    const desc = d.description_en ?? `Download ${d.title_en} from Egytic Sports.`;
    const url = `/downloads/${d.slug_en}`;
    const image = d.preview_image ?? "";
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
        { rel: "alternate", hrefLang: "ar", href: d.slug_ar ? `/downloads/${d.slug_ar}` : url },
        { rel: "alternate", hrefLang: "x-default", href: url },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/downloads"><ArrowLeft className="h-4 w-4" /> Back to downloads</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Download not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/downloads"><ArrowLeft className="h-4 w-4" /> Back to downloads</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  component: DownloadDetailPage,
});

function DownloadDetailPage() {
  const { slug } = Route.useParams();
  const { lang } = useLang();
  const ar = lang === "ar";
  const { data: item } = useSuspenseQuery(downloadBySlugQueryOptions(slug));
  const { data: allItems } = useSuspenseQuery(downloadsPublishedQueryOptions);
  const { data: page } = useSuspenseQuery(downloadsPageSettingsQueryOptions);

  if (!item) return null;

  const L = page.labels;
  const title = ar ? item.title_ar : item.title_en;
  const description = ar ? item.description_ar : item.description_en;
  const downloadLabel = ar ? L.download_ar : L.download_en;
  const categoryLabel = (() => {
    const preset = page.categories.find((c) => c.key === item.category);
    if (preset) return ar ? preset.label_ar : preset.label_en;
    return item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "";
  })();

  const related = allItems.filter((r) => r.id !== item.id && r.category === item.category).slice(0, 4);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: ar ? "التحميلات" : "Downloads", to: "/downloads" },
              { label: title },
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/80">
            {categoryLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                <Tag className="h-3.5 w-3.5" /> {categoryLabel}
              </span>
            )}
            {item.featured && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                {ar ? "مميز" : "Featured"}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold md:text-5xl">{title}</h1>
          {description && (
            <p className="mt-4 max-w-3xl text-base text-white/85 md:text-lg">{description}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <DownloadGateButton
              fileUrl={item.file_url}
              title={title}
              slug={item.slug_en}
              requiresLead={item.requires_lead_capture}
              label={downloadLabel}
              size="lg"
              variant="secondary"
            />
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/downloads">
                <ArrowLeft className="h-4 w-4" /> {ar ? "كل التحميلات" : "All downloads"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                {item.preview_image ? (
                  <img
                    src={item.preview_image}
                    alt={title}
                    className="h-auto w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-accent text-primary">
                    <FileText className="h-24 w-24 opacity-70" />
                  </div>
                )}
              </div>
            </Reveal>

            {description && (
              <Reveal className="mt-8">
                <h2 className="text-xl font-bold text-foreground">
                  {ar ? "نظرة عامة" : "Overview"}
                </h2>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">{description}</p>
              </Reveal>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {ar ? "التحميل" : "Download"}
              </h3>
              <p className="mt-2 text-base font-medium text-foreground">{title}</p>
              {categoryLabel && (
                <p className="mt-1 text-sm text-muted-foreground">{categoryLabel}</p>
              )}
              <DownloadGateButton
                fileUrl={item.file_url}
                title={title}
                slug={item.slug_en}
                requiresLead={item.requires_lead_capture}
                label={downloadLabel}
                className="mt-4 w-full"
              />

            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {ar ? "مشاركة" : "Share"}
              </h3>
              <div className="mt-3">
                <ShareButtons title={title} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-foreground">
              {ar ? "تحميلات ذات صلة" : "Related downloads"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/downloads/$slug"
                  params={{ slug: r.slug_en }}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent text-primary">
                    {r.preview_image ? (
                      <img src={r.preview_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <FileText className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary">
                      {ar ? r.title_ar : r.title_en}
                    </h3>
                    {(ar ? r.description_ar : r.description_en) && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {ar ? r.description_ar : r.description_en}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
