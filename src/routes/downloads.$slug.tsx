import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { trackDownloadEvent } from "@/lib/downloadTracking";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Tag } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ShareButtons } from "@/components/site/ShareButtons";
import { DownloadGateButton } from "@/components/site/DownloadGateButton";
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
      return { meta: [{ title: "Download not found — Egytic Sports" }, { name: "robots", content: "noindex" }] };
    }
    const SITE_URL = "https://zenith-arena-build.lovable.app";
    const abs = (u: string | null | undefined) =>
      !u ? "" : /^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
    const pick = (...vals: (string | null | undefined)[]) =>
      vals.find((v) => typeof v === "string" && v.trim().length > 0) ?? "";

    const titleEn = pick(d.seo_title_en, `${d.title_en} — Egytic Sports`);
    const titleAr = pick(d.seo_title_ar, `${d.title_ar || d.title_en} — إيجيتك سبورتس`);
    const descEn = pick(d.seo_description_en, d.description_en, `Download ${d.title_en} from Egytic Sports.`);
    const descAr = pick(d.seo_description_ar, d.description_ar, descEn);

    const canonical = `${SITE_URL}/downloads/${d.slug_en}`;
    const arUrl = d.slug_ar ? `${SITE_URL}/downloads/${d.slug_ar}` : `${canonical}?lang=ar`;

    const SITE_FALLBACK = `${SITE_URL}/og-default.jpg`;
    const ogEn = abs(pick(d.og_image, d.preview_image)) || SITE_FALLBACK;
    const ogAr = abs(pick(d.og_image_ar, d.og_image, d.preview_image)) || SITE_FALLBACK;

    return {
      meta: [
        { title: `${titleEn} | ${titleAr}` },
        { name: "description", content: `${descEn} — ${descAr}` },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "Egytic Sports" },
        { property: "og:url", content: canonical },
        { property: "og:title", content: titleEn },
        { property: "og:description", content: descEn },
        { property: "og:locale", content: "en_US" },
        { property: "og:locale:alternate", content: "ar_EG" },
        { property: "og:image", content: ogEn },
        { property: "og:image:alt", content: titleEn },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titleEn },
        { name: "twitter:description", content: descEn },
        { name: "twitter:image", content: ogEn },
        { name: "twitter:image:alt", content: titleEn },
      ],
      links: [
        { rel: "canonical", href: canonical },
        { rel: "alternate", hrefLang: "en", href: canonical },
        { rel: "alternate", hrefLang: "ar", href: arUrl },
        { rel: "alternate", hrefLang: "x-default", href: canonical },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DigitalDocument",
            name: d.title_en,
            alternateName: d.title_ar || undefined,
            description: descEn,
            url: canonical,
            image: Array.from(new Set([ogEn, ogAr].filter(Boolean))),
            inLanguage: ["en", "ar"],
            publisher: { "@type": "Organization", name: "Egytic Sports", url: SITE_URL },
            ...(d.file_url ? { contentUrl: d.file_url } : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Downloads", item: `${SITE_URL}/downloads` },
              { "@type": "ListItem", position: 3, name: d.title_en, item: canonical },
            ],
          }),
        },
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

type DownloadFile = {
  label_en?: string;
  label_ar?: string;
  url: string;
  lang?: "en" | "ar" | "both";
  size?: number | null;
  mime?: string | null;
};

function formatBytes(n?: number | null) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0; let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function DownloadDetailPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const ar = lang === "ar";
  const { data: item } = useSuspenseQuery(downloadBySlugQueryOptions(slug));
  const { data: allItems } = useSuspenseQuery(downloadsPublishedQueryOptions);
  const { data: page } = useSuspenseQuery(downloadsPageSettingsQueryOptions);

  useEffect(() => { if (item?.id) trackDownloadEvent("view_detail", item.id); }, [item?.id]);

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

  const rawFiles = (Array.isArray(item.files) ? (item.files as unknown as DownloadFile[]) : []).filter((f) => f?.url);
  const langCode: "en" | "ar" = ar ? "ar" : "en";
  const localizedFiles = rawFiles.filter((f) => !f.lang || f.lang === "both" || f.lang === langCode);
  const gallery = (Array.isArray(item.gallery) ? (item.gallery as unknown as string[]) : []).filter((u) => typeof u === "string" && u.trim().length > 0);


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
                {t.downloadDetail.featured}
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
              downloadId={item.id}
              requiresLead={item.requires_lead_capture}
              label={downloadLabel}
              size="lg"
              variant="secondary"
            />
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link to="/downloads">
                <ArrowLeft className="h-4 w-4" /> {t.downloadDetail.allDownloads}
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
                  {t.downloadDetail.overview}
                </h2>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">{description}</p>
              </Reveal>
            )}

            {gallery.length > 0 && (
              <Reveal className="mt-8">
                <h2 className="text-xl font-bold text-foreground">
                  {t.downloadDetail.morePreviews}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={src}
                          alt={`${title} preview ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </a>
                  ))}
                </div>
              </Reveal>
            )}
          </div>


          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t.downloadDetail.download}
              </h3>
              <p className="mt-2 text-base font-medium text-foreground">{title}</p>
              {categoryLabel && (
                <p className="mt-1 text-sm text-muted-foreground">{categoryLabel}</p>
              )}
              <DownloadGateButton
                fileUrl={item.file_url}
                title={title}
                slug={item.slug_en}
                downloadId={item.id}
                requiresLead={item.requires_lead_capture}
                label={downloadLabel}
                className="mt-4 w-full"
              />

              {localizedFiles.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.downloadDetail.additionalFiles}
                  </p>
                  <ul className="space-y-2">
                    {localizedFiles.map((f, i) => {
                      const label = (ar ? f.label_ar : f.label_en) || f.label_en || f.label_ar || t.downloadDetail.downloadFallback;
                      return (
                        <li key={i}>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm transition hover:border-primary hover:bg-accent"
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Download className="h-4 w-4 shrink-0 text-primary" />
                              <span className="truncate font-medium">{label}</span>
                            </span>
                            {f.size ? (
                              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                {formatBytes(f.size)}
                              </span>
                            ) : null}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

            </div>


            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t.downloadDetail.share}
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
              {t.downloadDetail.related}
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
