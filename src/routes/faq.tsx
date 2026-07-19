import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { NotFound } from "@/components/site/NotFound";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
    return buildSeoHead({
      routePath: "/faq",
      seo: loaderData?.seo ?? null,
      fallbackTitleEn: "Frequently Asked Questions — Egytic Sports",
      fallbackTitleAr: "الأسئلة الشائعة — إيجيتك سبورتس",
      fallbackDescEn: "Answers to common questions about sports construction.",
      fallbackDescAr: "إجابات حول الأسئلة الشائعة في الإنشاءات الرياضية.",
      extraJsonLd: items.length ? [faqLd] : [],
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

  const groups = new Map<string, FaqItem[]>();
  for (const it of items) {
    const key = it.category || "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  const tx = T.pages.faq;
  const CATEGORY_LABELS = T.pages.faq.categories as Record<string, string>;

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-4xl space-y-12 px-4 sm:px-6 lg:px-8">
          {[...groups.entries()].map(([cat, list], gi) => {
            const label = CATEGORY_LABELS[cat] ?? cat;
            return (
              <Reveal key={cat}>
                <h2 className="mb-4 text-xl font-bold text-foreground">{label}</h2>
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
            <p className="text-center text-muted-foreground">{T.pages.faq.emptyPublished}</p>
          )}

          <Reveal className="rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant">
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
