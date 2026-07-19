import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useDeferredValue } from "react";
import { Search, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { NotFound } from "@/components/site/NotFound";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/i18n/LanguageProvider";
import { faqItemsPublishedQueryOptions, seoSettingsByRouteQueryOptions, type FaqItem } from "@/lib/queries";
import { buildSeoHead } from "@/lib/seo-head";

export const Route = createFileRoute("/faq")({
  loader: async ({ context }) => {
    const [items, seo] = await Promise.all([
      context.queryClient.ensureQueryData(faqItemsPublishedQueryOptions),
      context.queryClient.ensureQueryData(seoSettingsByRouteQueryOptions("/faq")),
    ]);
    return { seo, items };
  },
  head: ({ loaderData }) => {
    const items = loaderData?.items ?? [];
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((it) => ({
        "@type": "Question",
        name: it.question_en,
        acceptedAnswer: { "@type": "Answer", text: it.answer_en },
      })),
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://zenith-arena-build.lovable.app/" },
        { "@type": "ListItem", position: 2, name: "FAQ", item: "https://zenith-arena-build.lovable.app/faq" },
      ],
    };
    return buildSeoHead({
      routePath: "/faq",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Frequently Asked Questions — Egytic Sports",
      fallbackTitleAr: "الأسئلة الشائعة — إيجيتك سبورتس",
      fallbackDescEn: "Answers to common questions about sports construction.",
      fallbackDescAr: "إجابات حول الأسئلة الشائعة في الإنشاءات الرياضية.",
      extraJsonLd: items.length ? [faqLd, breadcrumbLd] : [breadcrumbLd],
    });
  },
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => <NotFound />,
  component: FaqPage,
});

function FaqPage() {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const { data: items } = useSuspenseQuery(faqItemsPublishedQueryOptions);
  const tx = T.pages.faq;
  const CATEGORY_LABELS = tx.categories as Record<string, string>;

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.category || "general");
    return [...set];
  }, [items]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter((it) => {
      const cat = it.category || "general";
      if (activeCat !== "all" && cat !== activeCat) return false;
      if (!q) return true;
      const hay = `${it.question_en} ${it.question_ar ?? ""} ${it.answer_en} ${it.answer_ar ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, deferredQuery, activeCat]);

  const groups = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const it of filtered) {
      const key = it.category || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return map;
  }, [filtered]);

  const hasFilters = activeCat !== "all" || query.trim().length > 0;
  const resultsLabel = tx.resultsCount
    .replace("{count}", String(filtered.length))
    .replace("{total}", String(items.length));

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Search + filters */}
          <Reveal className="mb-8 space-y-4">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${ar ? "right-3" : "left-3"}`} aria-hidden />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tx.searchPh}
                aria-label={tx.searchPh}
                className={ar ? "pr-9" : "pl-9"}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={tx.clear}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${ar ? "left-3" : "right-3"}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2" role="tablist" aria-label={tx.eyebrow}>
                <CategoryChip active={activeCat === "all"} onClick={() => setActiveCat("all")} label={tx.all} />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat}
                    active={activeCat === cat}
                    onClick={() => setActiveCat(cat)}
                    label={CATEGORY_LABELS[cat] ?? cat}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground" aria-live="polite">
              <span>{resultsLabel}</span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setActiveCat("all"); }}
                  className="text-primary hover:underline"
                >
                  {tx.clear}
                </button>
              )}
            </div>
          </Reveal>

          {/* Results */}
          <div className="space-y-10">
            {[...groups.entries()].map(([cat, list], gi) => {
              const label = CATEGORY_LABELS[cat] ?? cat;
              return (
                <Reveal key={cat}>
                  <div className="mb-3 flex items-center gap-3">
                    <h2 className="text-xl font-bold text-foreground">{label}</h2>
                    <Badge variant="secondary">{list.length}</Badge>
                  </div>
                  <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-2 shadow-soft">
                    {list.map((it, i) => (
                      <AccordionItem key={it.id} value={`${gi}-${i}`} className="border-border">
                        <AccordionTrigger className="text-start text-base font-semibold">
                          {ar ? it.question_ar || it.question_en : it.question_en}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                          {ar ? it.answer_ar || it.answer_en : it.answer_en}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Reveal>
              );
            })}

            {items.length === 0 && (
              <p className="text-center text-muted-foreground">{tx.emptyPublished}</p>
            )}
            {items.length > 0 && filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <p className="text-muted-foreground">{tx.noResults}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setActiveCat("all"); }}>
                  {tx.clear}
                </Button>
              </div>
            )}
          </div>

          <Reveal className="mt-12 rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant">
            <h3 className="text-xl font-bold sm:text-2xl">{tx.ctaTitle}</h3>
            <Button asChild variant="gold" size="lg" className="mt-5">
              <Link to="/contact">{tx.ctaBtn}</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
