import { useEffect, useMemo } from "react";
import { trackDownloadEvent } from "@/lib/downloadTracking";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Download, FileText, Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { DownloadGateButton } from "@/components/site/DownloadGateButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/i18n/LanguageProvider";
import { downloadsPublishedQueryOptions, downloadsPageSettingsQueryOptions } from "@/lib/queries";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  cat: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/downloads")({
  validateSearch: zodValidator(searchSchema),
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
  useEffect(() => { trackDownloadEvent("view_index"); }, []);
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const { q, cat } = Route.useSearch();
  const navigate = useNavigate({ from: "/downloads" });
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

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.category || "other");
    return Array.from(set);
  }, [items]);

  const labelFor = (key: string) => {
    const preset = categoryMap.get(key);
    if (preset) return ar ? preset.ar : preset.en;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (cat !== "all" && (it.category || "other") !== cat) return false;
      if (!needle) return true;
      const hay = [
        it.title_en, it.title_ar, it.description_en, it.description_ar,
        it.category, it.slug_en, it.slug_ar,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, cat]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of filtered) {
      const key = it.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const setQ = (value: string) =>
    navigate({ search: (prev: { q: string; cat: string }) => ({ ...prev, q: value }), replace: true });
  const setCat = (value: string) =>
    navigate({ search: (prev: { q: string; cat: string }) => ({ ...prev, cat: value }), replace: true });
  const clearAll = () => navigate({ search: { q: "", cat: "all" }, replace: true });

  const hasFilters = q.trim() !== "" || cat !== "all";

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={T.pages.downloads.searchPlaceholder}
                className="ps-9"
                aria-label={T.pages.downloads.search}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute inset-y-0 end-2 my-auto rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label={T.pages.downloads.clear}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                {T.pages.downloads.reset}
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CategoryChip active={cat === "all"} onClick={() => setCat("all")}>
              {T.pages.downloads.all} ({items.length})
            </CategoryChip>
            {availableCategories.map((key) => {
              const count = items.filter((i) => (i.category || "other") === key).length;
              return (
                <CategoryChip key={key} active={cat === key} onClick={() => setCat(key)}>
                  {labelFor(key)} ({count})
                </CategoryChip>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {T.pages.downloads.resultsOf(filtered.length, items.length)}
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                {items.length === 0 ? tx.empty : T.pages.downloads.noMatching}
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={clearAll}>
                  {T.pages.downloads.resetFilters}
                </Button>
              )}
            </div>
          ) : (
            grouped.map(([catKey, rows]) => (
              <Reveal key={catKey} className="mb-14">
                <h2 className="mb-6 text-2xl font-bold text-foreground">{labelFor(catKey)}</h2>
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
                          <HighlightText text={ar ? r.title_ar : r.title_en} query={q} />
                        </Link>
                        {(ar ? r.description_ar : r.description_en) && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            <HighlightText text={(ar ? r.description_ar : r.description_en) as string} query={q} />
                          </p>

                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/downloads/$slug" params={{ slug: r.slug_en }}>
                              {ar ? "التفاصيل" : "Details"}
                            </Link>
                          </Button>
                          <DownloadGateButton
                            fileUrl={r.file_url}
                            title={ar ? r.title_ar : r.title_en}
                            slug={r.slug_en}
                            downloadId={r.id}
                            requiresLead={r.requires_lead_capture}
                            label={tx.download}
                            size="sm"
                          />

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

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50 hover:text-primary")
      }
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

