import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageProvider";
import { downloadsPublishedQueryOptions, downloadsPageSettingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/downloads")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(downloadsPublishedQueryOptions),
    context.queryClient.ensureQueryData(downloadsPageSettingsQueryOptions),
  ]),
  head: () => ({
    meta: [
      { title: "Catalogs & Technical Downloads — Egytic Sports" },
      {
        name: "description",
        content:
          "Download the Egytic company profile, product catalogs, technical datasheets, certificates and maintenance guides for sports construction projects.",
      },
      { property: "og:title", content: "Catalogs & Technical Downloads — Egytic" },
      { property: "og:description", content: "Company profile, product catalogs, datasheets and maintenance guides." },
    ],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => null,
  component: DownloadsPage,
});

function DownloadsPage() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { data: items } = useSuspenseQuery(downloadsPublishedQueryOptions);
  const { data: page } = useSuspenseQuery(downloadsPageSettingsQueryOptions);

  const L = page.labels;
  const tx = {
    eyebrow: ar ? L.eyebrow_ar : L.eyebrow_en,
    title: ar ? L.title_ar : L.title_en,
    sub: ar ? L.sub_ar : L.sub_en,
    download: ar ? L.download_ar : L.download_en,
    empty: ar ? L.empty_ar : L.empty_en,
  };

  const categoryMap = useMemo(() => {
    const m = new Map<string, { en: string; ar: string }>();
    for (const c of page.categories) m.set(c.key, { en: c.label_en, ar: c.label_ar });
    return m;
  }, [page.categories]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const key = it.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const labelFor = (key: string) => {
    const preset = categoryMap.get(key);
    if (preset) return ar ? preset.ar : preset.en;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };


  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{tx.empty}</p>
          ) : (
            grouped.map(([cat, rows]) => (
              <Reveal key={cat} className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{labelFor(cat)}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {rows.map((r) => (
                    <div key={r.id} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                      <Link
                        to="/downloads/$slug"
                        params={{ slug: r.slug_en }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary overflow-hidden"
                        aria-label={ar ? r.title_ar : r.title_en}
                      >
                        {r.preview_image ? (
                          <img src={r.preview_image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/downloads/$slug"
                          params={{ slug: r.slug_en }}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {ar ? r.title_ar : r.title_en}
                        </Link>
                        {(ar ? r.description_ar : r.description_en) && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ar ? r.description_ar : r.description_en}</p>
                        )}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/downloads/$slug" params={{ slug: r.slug_en }}>
                              {ar ? "التفاصيل" : "Details"}
                            </Link>
                          </Button>
                          {r.file_url ? (
                            <Button asChild size="sm">
                              <a href={r.file_url} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                                {tx.download}
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" disabled>
                              <Download className="h-4 w-4" />
                              {tx.download}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
